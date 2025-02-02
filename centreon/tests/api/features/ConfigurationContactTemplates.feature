Feature: List Contact Templates API
  In order to use List Contact Templates API
  As a logged user
  I need to be able to list Access Groups

  Background:
    Given a running instance of Centreon Web API

  Scenario: List Contact Templates as an admin user
    Given I am logged in
    And the endpoints are described in Centreon Web API documentation

    When I send a GET request to '/api/latest/configuration/contacts/templates'
    Then the response code should be "200"
    And the JSON should be equal to:
    """
      {
        "result": [
          {
            "id": 19,
            "name": "contact_template"
          }
        ],
        "meta": {
          "page": 1,
          "limit": 10,
          "search": {},
          "sort_by": {},
          "total": 1
        }
      }
    """

  Scenario: List Contact Templates as a non-admin user with no rights to reach API
  Given the following CLAPI import data:
    """
      CONTACT;ADD;kev;kev;kev@localhost;Centreon@2022;0;1;en_US;local
      CONTACT;setparam;kev;reach_api;1
    """
    And I am logged in with "kev"/"Centreon@2022"
    When I send a GET request to '/api/latest/configuration/contacts/templates'
    Then the response code should be "403"

  Scenario: List Contact Templates as a non-admin user with rights to reach API
    Given the following CLAPI import data:
    """
      CONTACT;ADD;kev;kev;kev@localhost;Centreon@2022;0;1;en_US;local
      CONTACT;setparam;kev;reach_api;1
      ACLMENU;ADD;new_contact_menu;new_contact_menu
      ACLMENU;SETPARAM;new_contact_menu;activate;1
      ACLMENU;GRANTRW;new_contact_menu;0;Configuration;Users
      ACLMENU;GRANTRO;new_contact_menu;0;Configuration;Users;Contact Templates
      ACLGROUP;ADD;new_aclgroup;new_aclgroup
      ACLGROUP;SETMENU;new_aclgroup;new_contact_menu
      ACLGROUP;SETCONTACT;new_aclgroup;kev
    """
    And I am logged in with "kev"/"Centreon@2022"

    When I send a GET request to '/api/latest/configuration/contacts/templates'
    Then the response code should be "200"
    And the JSON should be equal to:
    """
      {
        "result": [
          {
            "id": 19,
            "name": "contact_template"
          }
        ],
        "meta": {
          "page": 1,
          "limit": 10,
          "search": {},
          "sort_by": {},
          "total": 1
        }
      }
    """

  Scenario: List Contact Templates as a non-admin user without rights to Reach API
    Given the following CLAPI import data:
    """
      CONTACT;ADD;kev;kev;kev@localhost;Centreon@2022;0;1;en_US;local
      CONTACT;setparam;kev;reach_api;0
    """
    And I am logged in with "kev"/"Centreon@2022"

    When I send a GET request to '/api/latest/configuration/contacts/templates'
    Then the response code should be "403"
