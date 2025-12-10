# features/auth.feature
Feature: Authentication System
  As a user
  I want to authenticate into the system
  So that I can access protected resources

  Background:
    Given the authentication service is running
    And the database is clean

  Scenario: Register a new passenger user
    When I register with the following details:
      | email | password         | name       | phone      | role      |
      | new@test.com | Password123! | John Doe   | 0612345678 | passenger |
    Then the registration should be successful
    And I should receive an access token
    And I should receive a refresh token
    And the user role should be "passenger"

  Scenario: Register with existing email
    Given a user exists with email "existing@test.com"
    When I register with email "existing@test.com" and password "Password123!"
    Then the registration should fail
    And I should receive error "User already exists"

  Scenario: Login with valid credentials
    Given a user exists with email "test@example.com" and password "Password123!"
    When I login with email "test@example.com" and password "Password123!"
    Then the login should be successful
    And I should receive an access token
    And I should receive a refresh token
    And the returned user email should be "test@example.com"

  Scenario: Login with invalid credentials
    Given a user exists with email "test@example.com" and password "Password123!"
    When I login with email "test@example.com" and password "WrongPassword"
    Then the login should fail
    And I should receive error "Invalid credentials"

  Scenario: Login with non-existent email
    When I login with email "nonexistent@test.com" and password "Password123!"
    Then the login should fail
    And I should receive error "Invalid credentials"

  Scenario: Refresh access token
    Given a user is authenticated with email "test@example.com"
    When I refresh the access token using the refresh token
    Then the token refresh should be successful
    And I should receive a new access token
    And I should receive a new refresh token

  Scenario: Refresh with invalid token
    When I try to refresh with invalid token "invalidtoken123"
    Then the token refresh should fail
    And I should receive error "Invalid refresh token"

  Scenario: Logout user
    Given a user is authenticated with email "test@example.com"
    When I logout
    Then the logout should be successful
    And I should receive confirmation message

  Scenario: Access protected resource with valid token
    Given a user is authenticated with email "test@example.com"
    When I request the user profile endpoint
    Then I should receive the user profile
    And the profile email should be "test@example.com"

  Scenario: Access protected resource without token
    When I request the user profile endpoint without authentication
    Then the request should fail
    And I should receive error "Unauthorized"
