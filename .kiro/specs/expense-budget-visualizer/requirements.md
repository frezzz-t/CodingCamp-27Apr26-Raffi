# Requirements Document

## Introduction

The Expense & Budget Visualizer is a client-side web application that allows users to track personal expenses, categorize spending, and visualize their budget distribution through an interactive pie chart. The application runs entirely in the browser using HTML, CSS, and vanilla JavaScript, with all data persisted via the browser's Local Storage API. No backend server, build tools, or test setup is required.

## Glossary

- **App**: The Expense & Budget Visualizer web application.
- **Transaction**: A single expense entry consisting of an item name, a monetary amount, and a category.
- **Category**: One of three predefined spending labels — Food, Transport, or Fun — used to classify a Transaction.
- **Transaction_List**: The scrollable UI component that displays all stored Transactions.
- **Input_Form**: The UI form component through which the user enters a new Transaction.
- **Balance_Display**: The UI component at the top of the page that shows the running total of all Transaction amounts.
- **Chart**: The pie chart UI component that visualizes spending distribution by Category.
- **Chart_Summary**: A text-based breakdown of spending per Category displayed alongside the Chart.
- **Local_Storage**: The browser's `localStorage` API used to persist Transaction data client-side.
- **Validator**: The client-side logic responsible for checking that all Input_Form fields are valid before submission.

---

## Requirements

### Requirement 1: Add a Transaction

**User Story:** As a user, I want to fill in a form with an item name, amount, and category and submit it, so that the transaction is recorded and visible in my expense list.

#### Acceptance Criteria

1. THE Input_Form SHALL provide a text field for the item name, a numeric field for the amount, and a dropdown selector for the Category (Food, Transport, Fun).
2. WHEN the user submits the Input_Form with all fields valid, THE App SHALL add the Transaction to the Transaction_List.
3. WHEN the user submits the Input_Form with all fields valid, THE App SHALL persist the Transaction to Local_Storage.
4. WHEN the user submits the Input_Form with all fields valid, THE Input_Form SHALL reset all fields to their default empty state.
5. IF the user submits the Input_Form with one or more fields invalid, THEN THE Validator SHALL prevent the Transaction from being added and SHALL display field-level error messages as defined in Requirement 7.

### Requirement 2: View Transaction List

**User Story:** As a user, I want to see a scrollable list of all my recorded transactions, so that I can review my spending history.

#### Acceptance Criteria

1. THE Transaction_List SHALL display all stored Transactions, each showing the item name, amount, and Category.
2. WHILE the number of Transactions exceeds the visible area of the Transaction_List, THE Transaction_List SHALL be scrollable.
3. WHEN the App loads in the browser, THE Transaction_List SHALL populate with all Transactions previously persisted in Local_Storage.

### Requirement 3: Delete a Transaction

**User Story:** As a user, I want to delete a transaction from the list, so that I can correct mistakes or remove outdated entries.

#### Acceptance Criteria

1. THE Transaction_List SHALL display a delete control for each Transaction entry.
2. WHEN the user activates the delete control for a Transaction, THE App SHALL remove that Transaction from the Transaction_List.
3. WHEN the user activates the delete control for a Transaction, THE App SHALL remove that Transaction from Local_Storage.

### Requirement 4: Display Total Balance

**User Story:** As a user, I want to see my total spending balance at the top of the page, so that I always know how much I have spent in total.

#### Acceptance Criteria

1. THE Balance_Display SHALL show the sum of all Transaction amounts.
2. WHEN a Transaction is added, THE Balance_Display SHALL update to reflect the new total without requiring a page reload.
3. WHEN a Transaction is deleted, THE Balance_Display SHALL update to reflect the new total without requiring a page reload.
4. WHEN the App loads in the browser, THE Balance_Display SHALL reflect the total of all Transactions persisted in Local_Storage.

### Requirement 5: Visualize Spending by Category

**User Story:** As a user, I want to see a pie chart of my spending broken down by category, so that I can understand where my money is going.

#### Acceptance Criteria

1. THE Chart SHALL display a pie chart with one segment per Category that has at least one Transaction.
2. THE Chart SHALL calculate each segment's proportion as the sum of Transaction amounts for that Category divided by the total of all Transaction amounts.
3. WHEN a Transaction is added, THE Chart SHALL update automatically to reflect the new spending distribution without requiring a page reload.
4. WHEN a Transaction is deleted, THE Chart SHALL update automatically to reflect the new spending distribution without requiring a page reload.
5. WHEN the App loads in the browser, THE Chart SHALL render based on all Transactions persisted in Local_Storage.
6. WHILE no Transactions exist, THE Chart SHALL display a placeholder state indicating that no data is available.
7. THE Chart_Summary SHALL display the total amount spent per Category as a text list alongside the Chart.
8. WHEN a Transaction is added or deleted, THE Chart_Summary SHALL update to reflect the current totals per Category without requiring a page reload.

### Requirement 6: Data Persistence Across Sessions

**User Story:** As a user, I want my transactions to be saved between browser sessions, so that I do not lose my data when I close and reopen the browser.

#### Acceptance Criteria

1. WHEN the App loads in the browser, THE App SHALL read all previously stored Transactions from Local_Storage and restore the full application state.
2. WHEN a Transaction is added or deleted, THE App SHALL synchronize the current Transaction list to Local_Storage before the operation is considered complete.
3. THE App SHALL store all Transaction data exclusively in Local_Storage with no external network requests.

### Requirement 7: Input Validation

**User Story:** As a user, I want the form to validate my input before submission, so that invalid or incomplete data is never recorded.

#### Acceptance Criteria

1. IF the user submits the Input_Form with the item name field empty, THEN THE Validator SHALL display an error message adjacent to the item name field and SHALL NOT add the Transaction.
2. IF the user submits the Input_Form with the amount field empty or containing a value less than or equal to zero, THEN THE Validator SHALL display an error message adjacent to the amount field and SHALL NOT add the Transaction.
3. IF the user submits the Input_Form with no Category selected, THEN THE Validator SHALL display an error message adjacent to the Category selector and SHALL NOT add the Transaction.
4. WHEN the user corrects a previously invalid field and resubmits, THE Validator SHALL clear the prior error message for that field.

### Requirement 8: Responsive and Accessible UI

**User Story:** As a user, I want the application to be readable and usable across modern browsers and screen sizes, so that I can use it on any device.

#### Acceptance Criteria

1. THE App SHALL render correctly in current stable versions of Chrome, Firefox, Edge, and Safari.
2. THE App SHALL use a single CSS file located at `css/styles.css` and a single JavaScript file located at `js/app.js`.
3. THE App SHALL maintain a contrast ratio of at least 4.5:1 between text and its background color for all body text and UI labels.
4. THE Input_Form, Transaction_List, Balance_Display, and Chart SHALL remain usable on viewport widths from 320px to 1920px.
5. THE App SHALL require no installation, build step, or server — it SHALL be openable directly as a local HTML file in a browser.
