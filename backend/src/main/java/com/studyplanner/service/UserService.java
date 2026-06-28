package com.studyplanner.service;

import com.studyplanner.dto.request.PasswordRequest;
import com.studyplanner.dto.request.ProfileRequest;
import com.studyplanner.dto.request.RegisterRequest;
import com.studyplanner.entity.User;
import com.studyplanner.entity.UserPreference;
import com.studyplanner.repository.UserPreferenceRepository;
import com.studyplanner.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

@Service
public class UserService {
    @Autowired
    UserRepository userRepository;

    @Autowired
    UserPreferenceRepository userPreferenceRepository;

    @Autowired
    PasswordEncoder encoder;

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Error: User not found."));
    }

    public UserPreference getPreferenceByUserId(Long userId) {
        return userPreferenceRepository.findByUserId(userId)
                .orElseGet(() -> {
                    User user = getUserById(userId);
                    UserPreference pref = new UserPreference(user, 4.0, LocalTime.of(9, 0));
                    return userPreferenceRepository.save(pref);
                });
    }

    @Transactional
    public User registerUser(RegisterRequest signUpRequest) {
        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            throw new RuntimeException("Error: Username is already taken!");
        }

        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            throw new RuntimeException("Error: Email is already in use!");
        }

        // Create new user's account
        User user = new User(
                signUpRequest.getUsername(),
                signUpRequest.getEmail(),
                encoder.encode(signUpRequest.getPassword()),
                signUpRequest.getFirstName(),
                signUpRequest.getLastName()
        );

        User savedUser = userRepository.save(user);

        // Create default user preference
        UserPreference preference = new UserPreference(savedUser, 4.0, LocalTime.of(9, 0));
        userPreferenceRepository.save(preference);

        return savedUser;
    }

    @Transactional
    public User updateProfile(Long userId, ProfileRequest profileRequest) {
        User user = getUserById(userId);

        if (!user.getEmail().equalsIgnoreCase(profileRequest.getEmail()) && userRepository.existsByEmail(profileRequest.getEmail())) {
            throw new RuntimeException("Error: Email is already in use!");
        }

        user.setEmail(profileRequest.getEmail());
        user.setFirstName(profileRequest.getFirstName());
        user.setLastName(profileRequest.getLastName());

        // Update preferences
        UserPreference preference = getPreferenceByUserId(userId);
        preference.setDailyStudyHours(profileRequest.getDailyStudyHours());
        
        LocalTime startTime = LocalTime.parse(profileRequest.getPreferredStartTime(), DateTimeFormatter.ofPattern("HH:mm"));
        preference.setPreferredStartTime(startTime);
        userPreferenceRepository.save(preference);

        return userRepository.save(user);
    }

    @Transactional
    public void updatePassword(Long userId, PasswordRequest passwordRequest) {
        User user = getUserById(userId);

        if (!encoder.matches(passwordRequest.getOldPassword(), user.getPassword())) {
            throw new RuntimeException("Error: Current password does not match!");
        }

        user.setPassword(encoder.encode(passwordRequest.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional
    public void resetPassword(String username, String email, String newPassword) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Error: Username not found."));

        if (!user.getEmail().equalsIgnoreCase(email)) {
            throw new RuntimeException("Error: Email address does not match the registered user.");
        }

        user.setPassword(encoder.encode(newPassword));
        userRepository.save(user);
    }
}
