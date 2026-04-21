# Requirements

> Auto-generated from spec files — 2026-04-17

## Summary

| Metric             | Count |
|--------------------|-------|
| Total requirements | 193   |
| P1 (Critical)      | 0     |
| P2 (Important)     | 0     |
| P3 (Nice-to-have)  | 193   |
| With known bugs    | 30    |

## RestfulBooker.Auth

| # | Method | Operation | Priority | When                             | Then (Rule)                                       | Bugs         |
|---|--------|-----------|----------|----------------------------------|---------------------------------------------------|--------------|
| 1 | -      | GET       | P3       | invalid credentials are provided | return 200 status code and reason Bad credentials | BUG-AUTH-001 |

## RestfulBooker.Booking

| #  | Method | Operation     | Priority | When                                                    | Then (Rule)                                                              | Bugs            |
|----|--------|---------------|----------|---------------------------------------------------------|--------------------------------------------------------------------------|-----------------|
| 1  | POST   | Create        | P3       | valid booking data with all fields is provided          | return 200 status code and booking is created successfully               |                 |
| 2  | POST   | Create        | P3       | booking without optional field is provided              | return 200 status code and booking is created with empty additionalNeeds |                 |
| 3  | POST   | Create        | P3       | booking with minimal price is provided                  | return 200 status code and booking is created with price of 1            |                 |
| 4  | POST   | Create        | P3       | booking with maximal price is provided                  | return 200 status code and booking is created with price of 100000       |                 |
| 5  | POST   | Create        | P3       | booking with same-day checkout is provided              | return 200 status code and checkin equals checkout date                  |                 |
| 6  | POST   | Create        | P3       | booking with long stay is provided                      | return 200 status code and booking is created with extended duration     |                 |
| 7  | POST   | Create        | P3       | booking with deposit not paid is provided               | return 200 status code and depositpaid is false                          |                 |
| 8  | POST   | Create        | P3       | required field is missing                               | return 500 status code and Internal Server Error                         | BUG-BOOKING-002 |
| 9  | POST   | Create        | P3       | invalid data type is provided                           | return 200 status code when price is string                              | BUG-BOOKING-003 |
| 10 | POST   | Create        | P3       | invalid data type is provided                           | return 200 status code when deposit is string                            |                 |
| 11 | POST   | Create        | P3       | invalid data type is provided                           | return 500 status code when firstname is number                          |                 |
| 12 | POST   | Create        | P3       | invalid data type is provided                           | return 500 status code when lastname is boolean                          |                 |
| 13 | POST   | Create        | P3 ⏭️    | negative price is provided                              | return 500 status code due to missing validation                         | BUG-BOOKING-004 |
| 14 | POST   | Create        | P3       | zero price is provided                                  | return 200 status code as valid for promotional bookings                 |                 |
| 15 | POST   | Create        | P3       | invalid date format is provided                         | return 200 status code and invalid date format is accepted               | BUG-BOOKING-009 |
| 16 | POST   | Create        | P3       | checkout date is before checkin date                    | return 200 status code due to missing date logic validation              | BUG-BOOKING-005 |
| 17 | POST   | Create        | P3       | empty string value is provided for required field       | return 200 status code and booking is created with empty field           | BUG-BOOKING-006 |
| 18 | GET    | Retrieve      | P3       | all booking IDs are requested                           | return 200 status code and array of booking IDs                          |                 |
| 19 | GET    | Retrieve      | P3       | booking IDs filtered by firstname are requested         | return 200 status code and filtered results include created booking      |                 |
| 20 | GET    | Retrieve      | P3       | booking IDs filtered by lastname are requested          | return 200 status code and filtered results include created booking      |                 |
| 21 | GET    | Retrieve      | P3       | booking IDs filtered by full name are requested         | return 200 status code and filtered results include created booking      |                 |
| 22 | GET    | Retrieve      | P3       | booking IDs filtered by dates are requested             | return 200 status code and array response                                |                 |
| 23 | GET    | Retrieve      | P3       | booking IDs filtered by non-existing name are requested | return 200 status code and empty array                                   |                 |
| 24 | GET    | Retrieve      | P3       | existing booking ID is requested                        | return 200 status code and complete booking details                      |                 |
| 25 | GET    | Retrieve      | P3       | non-existing booking ID is requested                    | return 404 status code and Not Found message                             |                 |
| 26 | GET    | Retrieve      | P3       | invalid booking ID is requested                         | return 404 status code for string ID                                     | BUG-BOOKING-011 |
| 27 | GET    | Retrieve      | P3       | invalid booking ID is requested                         | return 404 status code for negative ID                                   |                 |
| 28 | GET    | Retrieve      | P3       | invalid booking ID is requested                         | return 404 status code for zero ID                                       |                 |
| 29 | GET    | Retrieve      | P3       | invalid booking ID is requested                         | return 200 status code for float ID due to truncation                    |                 |
| 30 | GET    | Retrieve      | P3       | invalid booking ID is requested                         | return 404 status code for special character ID                          |                 |
| 31 | PUT    | Update        | P3       | valid full update is provided with authentication       | return 200 status code and all fields are updated                        |                 |
| 32 | PUT    | Update        | P3       | update is attempted without authentication              | return 403 status code and Forbidden message                             |                 |
| 33 | PUT    | Update        | P3       | update for non-existing booking ID is attempted         | return 405 status code and Method Not Allowed message                    | BUG-BOOKING-007 |
| 34 | PATCH  | PartialUpdate | P3       | single field is partially updated                       | only specified field changes and others remain unchanged                 |                 |
| 35 | PATCH  | PartialUpdate | P3       | only checkin date is updated                            | checkin changes and checkout is preserved using workaround               | BUG-BOOKING-010 |
| 36 | PATCH  | PartialUpdate | P3       | only checkout date is updated                           | checkout changes and checkin is preserved using workaround               | BUG-BOOKING-010 |
| 37 | PATCH  | PartialUpdate | P3       | multiple fields are partially updated                   | all specified fields change and others remain unchanged                  |                 |
| 38 | PATCH  | PartialUpdate | P3       | partial update is attempted without authentication      | return 403 status code and Forbidden message                             |                 |
| 39 | PATCH  | PartialUpdate | P3       | partial update for non-existing ID is attempted         | return 405 status code and Method Not Allowed message                    | BUG-BOOKING-007 |
| 40 | DELETE | Delete        | P3       | valid booking ID is deleted with authentication         | return 201 status code and booking is deleted                            | BUG-BOOKING-008 |
| 41 | DELETE | Delete        | P3       | delete is attempted without authentication              | return 403 status code and Forbidden message                             |                 |
| 42 | DELETE | Delete        | P3       | non-existing booking ID is provided                     | return 405 status code and Method Not Allowed message                    | BUG-BOOKING-007 |
| 43 | DELETE | Delete        | P3       | cleaning up test data                                   | all remaining test bookings are deleted successfully                     | BUG-BOOKING-008 |

## CartPage.STANDARD

| #  | Method | Operation | Priority | When                                             | Then (Rule)                                                          | Bugs |
|----|--------|-----------|----------|--------------------------------------------------|----------------------------------------------------------------------|------|
| 1  | -      | -         | P3       | user visits the page                             | Cart page URL should be displayed                                    |      |
| 2  | -      | -         | P3       | user visits the page                             | Cart page title should be displayed                                  |      |
| 3  | -      | -         | P3       | user visits the page                             | no items should be displayed                                         |      |
| 4  | -      | -         | P3       | user visits the page                             | Continue Shopping button is displayed                                |      |
| 5  | -      | -         | P3       | user visits the page                             | Checkout button is displayed                                         |      |
| 6  | -      | -         | P3       | user visits the page                             | Quantity table header should be displayed                            |      |
| 7  | -      | -         | P3       | user visits the page                             | Description table header should be displayed                         |      |
| 8  | -      | -         | P3       | user clicks Continue Shopping button             | user should be redirected to the Inventory page                      |      |
| 9  | -      | -         | P3       | user adds random products and clicks Cart button | user should be redirected to the Cart page                           |      |
| 10 | -      | -         | P3       | user adds random products and clicks Cart button | number of items should correspond to the number of chosen products   |      |
| 11 | -      | -         | P3       | user adds random products and clicks Cart button | the Cart button with an appropriate number on the badge is displayed |      |
| 12 | -      | -         | P3       | user adds random products and clicks Cart button | Checkout button is displayed                                         |      |
| 13 | -      | -         | P3       | user adds random products and clicks Cart button | Continue Shopping button is displayed                                |      |
| 14 | -      | -         | P3       | user adds random products and clicks Cart button | Quantity table header should be displayed                            |      |
| 15 | -      | -         | P3       | user adds random products and clicks Cart button | Description table header should be displayed                         |      |
| 16 | -      | -         | P3       | user adds random products and clicks Cart button | on each item delete button should be displayed                       |      |
| 17 | -      | -         | P3       | user adds random products and clicks Cart button | on each item should have appropriate title, description and price    |      |
| 18 | -      | -         | P3       | user clicks delete button on random item         | the number of products is decreased                                  |      |
| 19 | -      | -         | P3       | user clicks delete button on random item         | the Cart button with an appropriate number on the badge is displayed |      |
| 20 | -      | -         | P3       | user clicks delete button on random item         | the removed product is not displayed                                 |      |
| 21 | -      | -         | P3       | user clicks Checkout button                      | user should be redirected to the Checkout page                       |      |

## Footer.STANDARD

| # | Method | Operation | Priority | When                       | Then (Rule)                                      | Bugs           |
|---|--------|-----------|----------|----------------------------|--------------------------------------------------|----------------|
| 1 | -      | -         | P3       | user reviews LinkedIn icon | LinkedIn icon should have correct href attribute |                |
| 2 | -      | -         | P3       | user reviews LinkedIn icon | LinkedIn icon should open in new tab             |                |
| 3 | -      | -         | P3       | user reviews LinkedIn icon | LinkedIn icon should be visible                  |                |
| 4 | -      | -         | P3       | user reviews Twitter icon  | Twitter icon should have correct href attribute  |                |
| 5 | -      | -         | P3       | user reviews Twitter icon  | Twitter icon should open in new tab              | BUG-FOOTER-001 |
| 6 | -      | -         | P3       | user reviews Twitter icon  | Twitter icon should be visible                   | BUG-FOOTER-001 |
| 7 | -      | -         | P3       | user reviews Facebook icon | Facebook icon should have correct href attribute |                |
| 8 | -      | -         | P3       | user reviews Facebook icon | Facebook icon should open in new tab             |                |
| 9 | -      | -         | P3       | user reviews Facebook icon | Facebook icon should be visible                  |                |

## Header.STANDARD

| #  | Method | Operation | Priority | When                            | Then (Rule)                                  | Bugs           |
|----|--------|-----------|----------|---------------------------------|----------------------------------------------|----------------|
| 1  | -      | -         | P3       | user reviews the Component      | Title is displayed                           |                |
| 2  | -      | -         | P3       | user reviews the Component      | Cart button is displayed                     |                |
| 3  | -      | -         | P3       | user reviews the Component      | Sidebar button is displayed                  |                |
| 4  | -      | -         | P3       | user reviews the Component      | Sidebar is not displayed                     |                |
| 5  | -      | -         | P3       | user reviews the Component      | Cart badge is not displayed                  |                |
| 6  | -      | -         | P3       | user opens the Sidebar          | Sidebar is displayed                         |                |
| 7  | -      | -         | P3       | user opens the Sidebar          | Close button is displayed                    |                |
| 8  | -      | -         | P3       | user opens the Sidebar          | Inventory option is displayed                |                |
| 9  | -      | -         | P3       | user opens the Sidebar          | About option is displayed with external link |                |
| 10 | -      | -         | P3       | user opens the Sidebar          | Reset App State option is displayed          |                |
| 11 | -      | -         | P3       | user opens the Sidebar          | Logout option is displayed                   |                |
| 12 | -      | -         | P3       | user closes the Sidebar         | user remains on the same page                |                |
| 13 | -      | -         | P3       | user closes the Sidebar         | Sidebar button is displayed                  |                |
| 14 | -      | -         | P3       | user closes the Sidebar         | Sidebar is not displayed                     |                |
| 15 | -      | -         | P3       | user adds products to cart      | Cart badge displays count of added products  |                |
| 16 | -      | -         | P3       | user clicks Reset App State     | Cart badge is not displayed                  |                |
| 17 | -      | -         | P3       | user clicks Reset App State     | Sidebar is displayed                         |                |
| 18 | -      | -         | P3       | user clicks Reset App State     | Remove buttons remain unchanged              | BUG-HEADER-001 |
| 19 | -      | -         | P3       | user clicks on Cart button      | user is redirected to the Cart page          |                |
| 20 | -      | -         | P3       | user clicks on Cart button      | Cart button is displayed                     |                |
| 21 | -      | -         | P3       | user clicks on Cart button      | Sidebar button is displayed                  |                |
| 22 | -      | -         | P3       | user clicks on Cart button      | Sidebar is not displayed                     |                |
| 23 | -      | -         | P3       | user clicks on Inventory option | user is redirected to the Inventory page     |                |
| 24 | -      | -         | P3       | user clicks on Inventory option | Cart button is displayed                     |                |
| 25 | -      | -         | P3       | user clicks on Inventory option | Sidebar button is displayed                  |                |
| 26 | -      | -         | P3       | user clicks on Inventory option | Sidebar is not displayed                     |                |
| 27 | -      | -         | P3       | user logs out                   | user is redirected to the Login page         |                |

## InventoryPage.STANDARD

| #  | Method | Operation | Priority | When                                                            | Then (Rule)                                         | Bugs              |
|----|--------|-----------|----------|-----------------------------------------------------------------|-----------------------------------------------------|-------------------|
| 1  | -      | -         | P3       | user visits the page                                            | page URL should be displayed                        |                   |
| 2  | -      | -         | P3       | user visits the page                                            | page title should be displayed                      |                   |
| 3  | -      | -         | P3       | user visits the page                                            | default sorting dropdown with default value         |                   |
| 4  | -      | -         | P3       | user visits the page                                            | default number of product cards should be displayed | BUG-FOOTER-003    |
| 5  | -      | -         | P3       | user clicks on sorting dropdown                                 | name ascending sorting option is marked as chosen   |                   |
| 6  | -      | -         | P3       | user clicks on sorting dropdown                                 | name descending sorting option is displayed         |                   |
| 7  | -      | -         | P3       | user clicks on sorting dropdown                                 | price ascending sorting option is displayed         |                   |
| 8  | -      | -         | P3       | user clicks on sorting dropdown                                 | price descending sorting option is displayed        |                   |
| 9  | -      | -         | P3       | user clicks on name descending sorting option                   | default sorting dropdown with value                 |                   |
| 10 | -      | -         | P3       | user clicks on name descending sorting option                   | products are sorted by name descending              |                   |
| 11 | -      | -         | P3       | user clicks on price ascending sorting option                   | default sorting dropdown with value                 |                   |
| 12 | -      | -         | P3       | user clicks on price ascending sorting option                   | products are sorted by price ascending              |                   |
| 13 | -      | -         | P3       | user clicks on price descending sorting option                  | default sorting dropdown with value                 |                   |
| 14 | -      | -         | P3       | user clicks on price descending sorting option                  | products are sorted by price descending             |                   |
| 15 | -      | -         | P3       | user clicks on Name ascending sorting option                    | default sorting dropdown with value                 |                   |
| 16 | -      | -         | P3       | user clicks on Name ascending sorting option                    | products are sorted by name ascending               |                   |
| 17 | -      | -         | P3       | user clicks on Cart button                                      | user should be redirected to the Cart page          |                   |
| 18 | -      | -         | P3       | user navigates back from Cart page using back command           | user should be redirected to the Inventory page     |                   |
| 19 | -      | -         | P3       | user clicks on Title of product card that was not added to cart | user should be redirected to the Product page       |                   |
| 20 | -      | -         | P3       | user clicks on Title of product card that was not added to cart | Product title should be displayed                   | BUG-INVENTORY-001 |
| 21 | -      | -         | P3       | user navigates back from Product page using back command        | user should be redirected to the Inventory page     |                   |

## InventoryPage.Footer

| # | Method | Operation | Priority | When                 | Then (Rule)                                               | Bugs                           |
|---|--------|-----------|----------|----------------------|-----------------------------------------------------------|--------------------------------|
| 1 | -      | STANDARD  | P3       | user visits the page | LinkedIn icon with link should be displayed               |                                |
| 2 | -      | STANDARD  | P3       | user visits the page | Twitter icon with link should be displayed                | BUG-FOOTER-001                 |
| 3 | -      | STANDARD  | P3       | user visits the page | Facebook icon with link should be displayed               | BUG-FOOTER-001                 |
| 4 | -      | STANDARD  | P3       | user visits the page | the Copyright notice with actual year should be displayed |                                |
| 5 | -      | STANDARD  | P3 ⏭️    | user visits the page | Terms Of Service link should be displayed                 | BUG-FOOTER-002                 |
| 6 | -      | STANDARD  | P3 ⏭️    | user visits the page | Privacy Policy link should be displayed                   | BUG-FOOTER-002, BUG-FOOTER-003 |

## InventoryPage.Card

| #  | Method | Operation | Priority | When                                                             | Then (Rule)                                                       | Bugs              |
|----|--------|-----------|----------|------------------------------------------------------------------|-------------------------------------------------------------------|-------------------|
| 1  | -      | STANDARD  | P3       | user visits the page                                             | each product card Title should be displayed                       | BUG-INVENTORY-001 |
| 2  | -      | STANDARD  | P3       | user visits the page                                             | each product card Description should be displayed                 | BUG-INVENTORY-002 |
| 3  | -      | STANDARD  | P3       | user visits the page                                             | each product card icon should be displayed                        |                   |
| 4  | -      | STANDARD  | P3       | user visits the page                                             | each product card Price should be displayed                       |                   |
| 5  | -      | STANDARD  | P3       | user visits the page                                             | each product card add to cart button should be displayed          |                   |
| 6  | -      | STANDARD  | P3       | user visits the page                                             | all products should be sorted by default parameter                |                   |
| 7  | -      | STANDARD  | P3       | user clicks on add to cart button for first random product       | the add to cart button is changed to remove button                |                   |
| 8  | -      | STANDARD  | P3       | user clicks on add to cart button for second random product      | the add to cart button is changed to remove button                |                   |
| 9  | -      | STANDARD  | P3       | user clicks on Cart button                                       | appropriate products are presented in the table                   | BUG-INVENTORY-001 |
| 10 | -      | STANDARD  | P3       | user clicks on Cart button                                       | the total number of products is correct                           |                   |
| 11 | -      | STANDARD  | P3       | user navigates back from Cart page using back command            | the remove button is displayed for the products added to the cart |                   |
| 12 | -      | STANDARD  | P3       | user clicks on remove button for first random product            | the remove button is changed to add button                        |                   |
| 13 | -      | STANDARD  | P3       | user clicks on add to cart button for first random product again | the add to cart button is changed to remove button                |                   |
| 14 | -      | STANDARD  | P3       | user navigates back from Product page using back command         | the remove button is displayed for the products added to the cart |                   |
| 15 | -      | STANDARD  | P3       | user clicks remove on all the added cards                        | the all the product cards have add to cart buttons                |                   |

## InventoryPage.Header

| # | Method | Operation | Priority | When                                                             | Then (Rule)                                                          | Bugs |
|---|--------|-----------|----------|------------------------------------------------------------------|----------------------------------------------------------------------|------|
| 1 | -      | STANDARD  | P3       | user clicks on add to cart button for first random product       | the Cart button with an appropriate number on the badge is displayed |      |
| 2 | -      | STANDARD  | P3       | user clicks on add to cart button for second random product      | the Cart button with an appropriate number on the badge is displayed |      |
| 3 | -      | STANDARD  | P3       | user navigates back from Cart page using back command            | the Cart button with an appropriate number on the badge is displayed |      |
| 4 | -      | STANDARD  | P3       | user clicks on remove button for first random product            | the Cart button with an appropriate number on the badge is displayed |      |
| 5 | -      | STANDARD  | P3       | user clicks on add to cart button for first random product again | the Cart button with an appropriate number on the badge is displayed |      |
| 6 | -      | STANDARD  | P3       | user navigates back from Product page using back command         | the Cart button with an appropriate number on the badge is displayed |      |
| 7 | -      | STANDARD  | P3       | user clicks remove on all the added cards                        | the Cart button badge is not existed                                 |      |

## LoginPage.STANDARD

| #  | Method | Operation | Priority | When                                                          | Then (Rule)                                                                                | Bugs          |
|----|--------|-----------|----------|---------------------------------------------------------------|--------------------------------------------------------------------------------------------|---------------|
| 1  | -      | -         | P3       | user reviews the page                                         | user should see Title                                                                      |               |
| 2  | -      | -         | P3       | user reviews the page                                         | user should see Username field with placeholder and empty value                            |               |
| 3  | -      | -         | P3       | user reviews the page                                         | user should see Password field with placeholder, password input and empty value            |               |
| 4  | -      | -         | P3       | user reviews the page                                         | user should see authenticate button                                                        |               |
| 5  | -      | -         | P3       | user logs in with valid credentials                           | user should be navigated to the Inventory page                                             |               |
| 6  | -      | -         | P3       | user logouts                                                  | user should see Title                                                                      |               |
| 7  | -      | -         | P3       | user logouts                                                  | user should see Username field with placeholder and empty value                            |               |
| 8  | -      | -         | P3       | user logouts                                                  | user should see Password field with placeholder, password input and empty value            |               |
| 9  | -      | -         | P3       | user logouts                                                  | user should see authenticate button                                                        |               |
| 10 | -      | -         | P3       | user logouts                                                  | fail notification should not be displayed                                                  |               |
| 11 | -      | -         | P3       | user clicks on the authenticate without passing credentials   | colored fail notification about missing username should be shown                           |               |
| 12 | -      | -         | P3       | user clicks on the authenticate without passing credentials   | fail collapse button should be shown                                                       |               |
| 13 | -      | -         | P3       | user clicks on the authenticate without passing credentials   | username field should be highlighted and contain fail icon                                 |               |
| 14 | -      | -         | P3       | user clicks on the authenticate without passing credentials   | password field should be highlighted and contain fail icon                                 |               |
| 15 | -      | -         | P3       | user clicks on fail collapse button                           | fail notification should not be displayed                                                  |               |
| 16 | -      | -         | P3       | user clicks on fail collapse button                           | username field should not be highlighted and contain fail icon                             |               |
| 17 | -      | -         | P3       | user clicks on fail collapse button                           | password field should not be highlighted and contain fail icon                             |               |
| 18 | -      | -         | P3       | user types actual username without password                   | colored fail notification about missing password should be shown                           |               |
| 19 | -      | -         | P3       | user types actual username without password                   | fail collapse button should be shown                                                       |               |
| 20 | -      | -         | P3       | user types actual username without password                   | username field should be highlighted and contain error icon                                | BUG-LOGIN-001 |
| 21 | -      | -         | P3       | user types actual username without password                   | password field should be highlighted and contain fail icon                                 | BUG-LOGIN-001 |
| 22 | -      | -         | P3       | user types actual password without username                   | colored fail notification about missing username should be shown                           |               |
| 23 | -      | -         | P3       | user types actual password without username                   | fail collapse button should be shown                                                       |               |
| 24 | -      | -         | P3       | user types actual password without username                   | username field should be highlighted and contain fail icon                                 |               |
| 25 | -      | -         | P3       | user types actual password without username                   | password field should be highlighted and contain error icon                                | BUG-LOGIN-002 |
| 26 | -      | -         | P3       | user types valid username and invalid password                | colored fail notification about credentials do not match any existing user should be shown |               |
| 27 | -      | -         | P3       | user types valid username and invalid password                | fail collapse button should be shown                                                       |               |
| 28 | -      | -         | P3       | user types valid username and invalid password                | username field should be highlighted and contain fail icon                                 |               |
| 29 | -      | -         | P3       | user types valid username and invalid password                | password field should be highlighted and contain fail icon                                 |               |
| 30 | -      | -         | P3       | user tries to use locked account                              | colored fail notification about locked user should be shown                                |               |
| 31 | -      | -         | P3       | user tries to use locked account                              | fail collapse button should be shown                                                       |               |
| 32 | -      | -         | P3       | user tries to use locked account                              | username field should be highlighted and contain fail icon                                 |               |
| 33 | -      | -         | P3       | user tries to use locked account                              | password field should be highlighted and contain fail icon                                 |               |
| 34 | -      | -         | P3       | user tries to navigate to Inventory page without authenticate | user should be navigated to the authenticate page                                          |               |
| 35 | -      | -         | P3       | user tries to navigate to Inventory page without authenticate | colored fail notification about access denied should be shown                              |               |
| 36 | -      | -         | P3       | user tries to navigate to Inventory page without authenticate | fail collapse button should be shown                                                       |               |
| 37 | -      | -         | P3       | user tries to navigate to Inventory page without authenticate | username field should be highlighted and contain fail icon                                 |               |
| 38 | -      | -         | P3       | user tries to navigate to Inventory page without authenticate | password field should be highlighted and contain fail icon                                 |               |

## CompletePurchase.STANDARD

| # | Method | Operation | Priority | When                                                                       | Then (Rule)                                                                                  | Bugs |
|---|--------|-----------|----------|----------------------------------------------------------------------------|----------------------------------------------------------------------------------------------|------|
| 1 | -      | -         | P3       | user adds multiple products to the shopping cart                           | all selected products should appear in the cart with correct titles, descriptions and prices |      |
| 2 | -      | -         | P3       | user proceeds to checkout and completes the delivery information form      | user should see an order summary page with product details                                   |      |
| 3 | -      | -         | P3       | user proceeds to checkout and completes the delivery information form      | user should see total price calculation                                                      |      |
| 4 | -      | -         | P3       | user reviews order summary and confirms purchase by clicking Finish button | user should see a thank you notification and order confirmation                              |      |
| 5 | -      | -         | P3       | user clicks the Back Home button on the order confirmation page            | user should be redirected to the inventory page with product catalog and reset shopping cart |      |

