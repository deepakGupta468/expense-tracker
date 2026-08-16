package com.expensetracker.security;

import com.expensetracker.entity.User;
import com.expensetracker.repository.UserRepository;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final ApiErrorWriter errorWriter;

    /** Login/register must stay reachable even when a stale token is lying around. */
    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        return request.getServletPath().startsWith("/api/auth/");
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(7);
        final Long userId;

        // Parsing happens before the DispatcherServlet, so GlobalExceptionHandler
        // cannot see these failures -- they must be answered here or the client
        // gets a bare 500 for an ordinary expired token.
        try {
            userId = jwtUtil.extractUserId(jwt);
        } catch (ExpiredJwtException ex) {
            log.debug("Rejected expired token: {}", ex.getMessage());
            errorWriter.write(response, HttpStatus.UNAUTHORIZED.value(),
                    "Your session has expired. Please sign in again.");
            return;
        } catch (JwtException | IllegalArgumentException ex) {
            log.debug("Rejected malformed token: {}", ex.getMessage());
            errorWriter.write(response, HttpStatus.UNAUTHORIZED.value(),
                    "Invalid authentication token. Please sign in again.");
            return;
        }

        if (userId != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            User user = userRepository.findById(userId).orElse(null);

            if (user == null || !jwtUtil.isTokenValid(jwt, userId)) {
                errorWriter.write(response, HttpStatus.UNAUTHORIZED.value(),
                        "Invalid authentication token. Please sign in again.");
                return;
            }
            // 401 rather than 403: the client has to drop this session entirely,
            // a deactivated account cannot authenticate again on its own.
            if (!user.isEnabled()) {
                errorWriter.write(response, HttpStatus.UNAUTHORIZED.value(),
                        "Your account has been deactivated. Contact an administrator.");
                return;
            }

            UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                    user,
                    null,
                    user.getAuthorities()
            );
            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authToken);
        }
        filterChain.doFilter(request, response);
    }
}
