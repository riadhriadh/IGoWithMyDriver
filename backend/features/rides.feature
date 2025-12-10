# features/rides.feature
Feature: Ride Management
  As a driver or passenger
  I want to manage rides
  So that I can provide or request transportation

  Background:
    Given the ride service is running
    And the database is clean
    And a driver user exists with email "driver@test.com"
    And a passenger user exists with email "passenger@test.com"

  Scenario: Passenger requests a ride
    Given I am logged in as passenger "passenger@test.com"
    When I request a ride with the following details:
      | pickupLatitude  | pickupLongitude | dropoffLatitude | dropoffLongitude | pickupAddress      | dropoffAddress     |
      | 48.8566         | 2.3522          | 48.8600         | 2.3600           | 123 Paris Street   | 456 Paris Avenue   |
    Then the ride should be created successfully
    And the ride status should be "REQUESTED"
    And I should receive a ride ID

  Scenario: Driver accepts a ride
    Given I am logged in as driver "driver@test.com"
    And a ride with status "REQUESTED" exists
    When the driver accepts the ride
    Then the ride status should be updated to "ACCEPTED"
    And the ride should be assigned to the driver
    And the passenger should be notified

  Scenario: Driver starts the ride
    Given I am logged in as driver "driver@test.com"
    And a ride with status "ACCEPTED" exists
    When the driver starts the ride
    Then the ride status should be "EN_ROUTE"
    And the passenger should be notified of ride start

  Scenario: Driver arrives at destination
    Given I am logged in as driver "driver@test.com"
    And a ride with status "EN_ROUTE" exists
    When the driver marks arrival at destination
    Then the ride status should be "DESTINATION"
    And the passenger should be notified of arrival

  Scenario: Ride completion
    Given I am logged in as driver "driver@test.com"
    And a ride with status "ONBOARD" exists
    When the driver completes the ride
    Then the ride status should be "COMPLETED"
    And the fare should be calculated
    And a payment should be created

  Scenario: Cancel ride before acceptance
    Given I am logged in as passenger "passenger@test.com"
    And a ride with status "REQUESTED" exists
    When the passenger cancels the ride
    Then the ride status should be "CANCELLED"
    And the driver should be notified of cancellation

  Scenario: Invalid status transition
    Given a ride with status "COMPLETED" exists
    When I try to update the ride status to "ACCEPTED"
    Then the update should fail
    And I should receive error "Invalid status transition"

  Scenario: Get ride history for passenger
    Given I am logged in as passenger "passenger@test.com"
    And the passenger has completed "5" rides
    When I request the ride history
    Then I should receive "5" completed rides
    And each ride should have a status and fare

  Scenario: Get active rides for driver
    Given I am logged in as driver "driver@test.com"
    And the driver has "2" active rides
    When I request active rides
    Then I should receive "2" active rides
    And the rides should show pickup and dropoff locations

  Scenario: Real-time ride location updates
    Given a ride is in progress
    And the driver is streaming location updates
    When the driver location is updated
    Then the passenger should receive the location update
    And the location should contain latitude and longitude
