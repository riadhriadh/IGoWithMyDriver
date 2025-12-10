# features/location.feature
Feature: Location Tracking System
  As a driver or admin
  I want to track real-time location updates
  So that I can ensure safety and provide accurate ride information

  Background:
    Given the location service is running
    And the database is clean
    And a driver user exists with email "driver@test.com"

  Scenario: Driver uploads location
    Given I am logged in as driver "driver@test.com"
    When I upload my current location:
      | latitude | longitude | accuracy | speed | bearing | batteryLevel |
      | 48.8566  | 2.3522    | 10.5     | 45.2  | 180     | 85           |
    Then the location should be saved successfully
    And the location should have a timestamp

  Scenario: Get latest driver location
    Given I am logged in as driver "driver@test.com"
    And the driver has uploaded "3" location updates
    When I request the latest location
    Then I should receive the most recent location
    And the location should have all required fields

  Scenario: Get location history
    Given I am logged in as driver "driver@test.com"
    And the driver has "20" location records
    When I request location history with limit "10"
    Then I should receive "10" location records
    And the records should be ordered by most recent first

  Scenario: Location distance calculation
    Given two locations exist:
      | latitude | longitude |
      | 48.8566  | 2.3522    |
      | 48.8600  | 2.3600    |
    When I calculate distance between the locations
    Then the distance should be calculated in kilometers
    And the distance should be greater than 0
    And the distance should be less than 100

  Scenario: WebSocket location stream
    Given I am logged in as driver "driver@test.com"
    And a passenger is tracking a ride
    When the driver connects to the location stream
    And the driver sends a location update
    Then the passenger should receive the location update in real-time
    And the update should contain latitude and longitude

  Scenario: Location accuracy and validity
    Given I am logged in as driver "driver@test.com"
    When I upload a location with:
      | latitude | longitude | accuracy |
      | 48.8566  | 2.3522    | 5.0      |
    Then the location should be validated
    And the coordinates should be within valid ranges
    And the accuracy should be recorded

  Scenario: Delete old location history
    Given I am logged in as driver "driver@test.com"
    And the driver has location records older than 30 days
    When the system performs location cleanup
    Then old location records should be deleted
    And recent location records should remain

  Scenario: Location tracking disabled
    Given I am logged in as driver "driver@test.com"
    And location tracking is disabled
    When I try to upload location
    Then the upload should be rejected
    And I should receive error "Location tracking disabled"

  Scenario: Multiple drivers location streams
    Given multiple drivers are active
    When each driver sends location updates simultaneously
    Then each location update should be recorded separately
    And there should be no data loss or mixing
