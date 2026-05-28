# SIGNUP LOGIN AND ROLES AND PERMISSIONS.

## Use Cases and Flow (V1)

### 1. PortalSelection Page (ON the UI) (UI ROUTE "/")

- On the "/" of the frontend, we will have 3 portal selection option. for inspiration for what this page should look like, see this image ![My Image](/project/portal_selction.png).

#### Portal 1 => Back Office Admin Portal

This is the portal for the back office admin.

- Main Text => Admin Portal
- Sub text => {{come up with something}}
- Small text => {{come up with something}}
- Colour scheme is Red (#dc2626)
  \_Selcecting this portal option routes you to http://localhost:5173/admin/login

#### Portal 2 => Manager Portal

This is the portal for the manager of a particular coperative or coperatives

- Main Text => Manager Portal
- Sub text => {{come up with something}}
- Small text => {{come up with something}}
- Colour scheme is Sky Blue (#0D8FAF)
  \_Selcecting this portal option routes you to http://localhost:5173/manager/login

#### Portal 3 => Member Portal

This is the portal for the members of a coperative

- Main Text => User Portal
- Sub text => {{come up with something}}
- Small text => {{come up with something}}
- Colour scheme is Light Purple (#7F56D9)
  \_Selcecting this portal option routes you to http://localhost:5173/member/login

### 2. Back Office Admin Page (ON the UI) (UI ROUTE "/admin/login")

#### A. Allow for Roles and Permissions management for Back Office Admins.

- There are 3 role types (RootAdmin, SuperAdmin and Admin)

- RootAdmin is created directly in the db with (fullname: Coop RootAdmin, email: cooprootadmin@mailinator.com, password: SecurePassword123). There can ONLY be one RootAdmin role at a time.
- I will seed this into the db directly.
- This RootAdmin can invite other Coop Admins and assign roles to them. (SuperAdmin(has full access) or Admin role(less priviledge))
- When inviting any Admin, Super Admin or RootAdmin must specify FullName, email (unique), Role(superAdmin or Admin) of the admin they want to invite.
- If SuperAdmin role is invited, then that person has full access. But if it's Admin, then this is a bit more nuanced.
- Admin role is based on each Coop Controller we create. Let's say we have 3 controllers (CoopLoans, CoopAjoManagement and CoopDues) that means we have 6 permission levels. Cause each controller automatically generates 2 permissions (READ, WRITE). So when I'm inviting, I can select CoopLoansRead, CoopAjoManagementRead and CoopDuesRead. Meaning this admin can read(view) the get endpoints but all post/put/patch/delete will fail. This also allows me to invite an Admin that will be able to ONLY do certain actions (maybe CoopDuesRead and CoopDuesWrite). This person now can help with management of Dues and won't have access to Ajo features or other features. This is the type of admin access that's needed. Even the CoopAdmin controller also will have permissions(where roles, invites and permissions are managed.)
- SuperAdmins can do role/permission control using the CoopAdmin controller and the admin management view of the dashboard. THey can revoke access, update access to certain controllers, etc.
- SuperAdmins have FULL READ AND WRITE ACCESS TO all controllers. However, there is ONLY one action that SuperAdmins cannot do. Which is to revoke other SuperAdmins and that makes sense cause you don't want one SuperAdmin to just come and take over the full system. That power to revoke superadmins lies in the SOLELY hands of the RootAdmin.
- Note that all controllers for Coop Admin must be prefixed by Coop to differetiate them from those controllers we will have for members and managers. (I guess this is a hint for the naming for the conrollers in the api specs)
- Each Admin created should have the following details
  Full Name, Email, Id, Password, Date Invited, Role(rootadmin, superadmin, admin), isActive(means that your access has not been revoked or terminated, this isActive is true by default, roles/permissions they have, defaultPasswordChanged, dateCreated, dateupdated, datedeleted, and any other detail you think is important for our flow and use case.).
- On the AdminUsers table in the database, add a flag to ensure only one entry for rootadmin. This is the table that holds all teh Back Office Admins.

#### B. Allow Coop Admin that was invited to change their password. (UI ROUTE /admin/change-password)

So that they can have privacy and security. Allow them login ONLY ONCE without changing password. Show this message on the UI. If they try to login the 2nd time wihtout changing their default password, send them to the change password page. to login, every admin uses Email and Password. I will add a demo Coop email and coop password. Just to make demos on staging a bit quicker. Please put these in env of the frontend like we did for the other ones. Just create the variable in the env of the frontend(client), I will fill it.

#### c. Password change flow. (UI ROUTE /admin/change-password)

- Admin Inputs email.
- OTP sent to email(6 digits).
- verify otp and put new password and confirm password. Redirect to login screen afterwards.
- In the future, the password change will be a bit more steeper for security, But for this mvp(v1), use this.

#### D. After logging in, show the dashboard to the Admin. (UI ROUTE /admin/dashboard)

- DashboardLayout for Coop Admin has Sidebar, topbar and then the frame for each component children.
- Sidebar Items (which coincide with the different controllers) => Dashboad, Coperatives, Loans, Dues, Admin Management, Settings. At the bottom of the sidebar, add the Admin name, email, role and logout bottun. At the top of the sidebar, we have Coop and logo, then instead of "School Admin" text, we have `Coop Admin`.
- The top bar has 'Welcome Back {{Admin full name}}. ON the right of the top bar, show that avatar stuff with initials inside it. Show the current date and time also. Still on the right of the top bar, add this Interactive text that changes and shows tips and motivation to the admin as he/she works. The text are just short phrases that keep the admin motivated and they change from time to time. For example `Security at all times.`, `Almost done.` `What a beautiful Monday.👩🏾`, `Cooperatives don't stop, why should you?😁` etc. Have about 25 of these phrases and messages and each should be shown in bold red text. Change the displayed phrase every 5 seconds.

### 3. Manager Page (ON the UI) (UI ROUTE "/manager/login")

#### A. Multi tenancy Manager Setup

- This simply means that each manager invited to a cooperative can possibly be a manager of multiple cooperatives and even have different roles and permissions in those coperatives.
- so one email profile can have manager profiles in multiple coperatives.
- I tried to structure the DB schema file following this exact same pattern to be able to handle this multi tenancy manager setup.

#### B. Allow for Roles and Permissions management for Managers of Coperatives.

- There are 3 role types (RootManager, SuperManager and Support)

- RootManager is the first Admin that is invited to the platform. There can ONLY be one RootManager role at a time for each Cooperative. A Back Office Admin can transfer this RootManager priviledge to another Manager of the Cooperative.
- This RootManager can invite other Managers for his cooperative and assign roles to them. (SuperManager(has full access) or Support role(less priviledge))
- When inviting any Manager, RootManager or SuperManager must specify FullName, email (unique), Role(SuperManager or support) of the manager they want to invite.
- If SuperManager role is invited, then that person has full access. But if it's Support, then this is a bit more nuanced.
- Support role is based on each Manager Controller we create. Let's say we have 3 controllers (ManagerLoans, managerAjoManagement and managerDues) that means we have 6 permission levels. Cause each controller automatically generates 2 permissions (READ, WRITE). So when I'm inviting, I can select ManagerLoansRead, ManagerAjoManagementRead and ManagerDuesRead. Meaning this manager can read(view) the get endpoints but all post/put/patch/delete will fail. This also allows me to invite an manager that will be able to ONLY do certain actions (maybe ManagerDuesRead and ManagerDuesWrite). This person now can help with management of Dues and won't have access to Ajo features or other features. This is the type of manager access that's needed. Even the ManagerAdmin controller also will have permissions(where roles, invites and permissions are managed.)
- Managers can do role/permission control using the CoopAdmin controller and the manager management view of the dashboard. THey can revoke access, update access to certain controllers, etc.
- SuperManagers have FULL READ AND WRITE ACCESS TO all controllers. However, there is ONLY one action that SuperManager cannot do. Which is to revoke other SuperManager and that makes sense cause you don't want one SuperManager to just come and take over the full system. That power to revoke SuperManager lies in the SOLELY hands of the RootManager.
- Note that all controllers for Management must be prefixed by Management to differetiate them from those controllers we will have for members and Admins. (I guess this is a hint for the naming for the conrollers in the api specs)
- Each Manager created should have the following details
  Full Name, Email, Id, Password, Date Invited, Role(RootManager, SuperManager, support), isActive(means that your access has not been revoked or terminated, this isActive is true by default, roles/permissions they have, defaultPasswordChanged, dateCreated, dateupdated, datedeleted, and any other detail you think is important for our flow and use case.).
- On the ManagementUsers table in the database, add a flag to ensure only one entry for RootManager per Cooperative.

#### C. Allow Managers that was invited to manage a cooperative to change their password. (UI ROUTE /manager/change-password)

So that they can have privacy and security. Allow them login ONLY ONCE without changing password. Show this message on the UI. If they try to login the 2nd time wihtout changing their default password, send them to the change password page. to login, every admin uses Email and Password. I will add a demo Coop email and coop password. Just to make demos on staging a bit quicker. Please put these in env of the frontend like we did for the other ones. Just create the variable in the env of the frontend(client), I will fill it.

#### D. Password change flow. (UI ROUTE /manager/change-password)

- Admin Inputs email.
- OTP sent to email(6 digits).
- verify otp and put new password and confirm password. Redirect to login screen afterwards.
- In the future, the password change will be a bit more steeper for security, But for this mvp(v1), use this.

#### E. After logging in, show the dashboard to the Managers. (UI ROUTE /manager/dashboard)

- DashboardLayout for Coop Admin has Sidebar, topbar and then the frame for each component children.
- Sidebar Items (which coincide with the different controllers) => Dashboad, Coperatives, Loans, Dues, Admin Management, Settings. At the bottom of the sidebar, add the Admin name, email, role and logout bottun. At the top of the sidebar, we have Coop and logo, then instead of "School Admin" text, we have `Coop Admin`.
- The top bar has 'Welcome Back {{Admin full name}}. ON the right of the top bar, show that avatar stuff with initials inside it. Show the current date and time also. Still on the right of the top bar, add this Interactive text that changes and shows tips and motivation to the admin as he/she works. The text are just short phrases that keep the admin motivated and they change from time to time. For example `Security at all times.`, `Almost done.` `What a beautiful Monday.👩🏾`, `Cooperatives don't stop, why should you?😁` etc. Have about 25 of these phrases and messages and each should be shown in bold red text. Change the displayed phrase every 5 seconds.

### 4. Member Page (ON the UI) (UI Route "/member/login")

#### A. Multi tenancy Member Setup

- This simply means that each emember created on the platform can be invited to multiple cooperatives and even have different properties for each of those corperatives.
- I tried to structure the DB schema file following this exact same pattern to be able to handle this multi tenancy member setup.
  When he logs in, IF HE has ONLY one coperative, he will be shown that one as default.
  But if he logs in and has multiple, he will be shown the default coperative and then also be shown a drop down to select the coperative he wants to interact with.

### 5. Coperative Creation and Manager Invite Flow (ON THE UI OF Back Office) (UI "/admin/coperatives")

- On this UI, we see a table showing all available coperatives. And an action button at the top right corner (Add Coperative). Only a Back Office Admin with the right roles and permissions can create a coperative. He passes all the primary details of a coperative like Name, etc.
- Once a coperative is created, back office admin can then click on this coperative from the table list and view the coperative details on "/admin/coperatives/:coperativeId
- On this page, he sees another side bar that allows him see different things about this particular coperative. however the important sidebar item rn is Managers which takes us to /admin/coperatives/:cooperativeId/managers.
- on this apge, he sees a list of all the managers of this particular coperative. He also sees an action button to create a manager. Clciking it shows a modal
- To create a manager, type teh FirstName, LastName, select role/permissions, email. once a manager is created, he will receive an email with the login link and default password (SecurePassword123) and email will tell him to change password when he wants to login.

### 6. Manager Invite Flow (ON THE UI OF manager) (UI " /manager/managers)

- on this apge, he sees a list of all the managers of this particular coperative in a table. He also sees an action button to create a manager. Clciking it shows a modal
- To create a manager, type the FirstName, LastName, select role/permissions, email. once a manager is created, he will receive an email with the login link and default password (SecurePassword123) and email will tell him to change password when he wants to login.
  Notice that this is the exact same thing for the Back office Admin.

### 7. Manager or Back Office Admin invites Members to a Coperative

- BackOfffice Admin/Manager that has the required permission and role can invite a member to a coperative.
  To invite a member as a back Office Admin, simply navigate to /admin/coperatives/:cooperativeId/members. THere will be an Invite member button on the top right...
  To do this from the manager portal, simply navigate to /manager/members. THere will be an Invite member button on the top right...

To invite a mmber, fill in first name, last name, email and click invite.
Once invite is clicked, we will create this entry on memberusers table(assuming email does not exist there already), then also create an entry on MemberUsersCoperatives and finally send a login link to this email and default password (SecurePassword123) and email will tell him to change password when he wants to login.

Also, once a new entry is added to the MemberUsersCoperatives table, we will hav eto generate a wallet dor this user in this coperative.
