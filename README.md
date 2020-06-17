# Smokin With Smithfield

## Table of Contents

- [Smokin With Smithfield](#smokin-with-smithfield)
  - [Table of Contents](#table-of-contents)
  - [Documentation](#documentation)
    - [Architecture](#architecture)
    - [Local Setup](#local-setup)
    - [Requirements](#requirements)
    - [Setup](#setup)
    - [Connecting to a remote staging or production Elastic Beanstalk database](#connecting-to-a-remote-staging-or-production-elastic-beanstalk-database)
    - [Deployment](#deployment)
    - [General Workflow](#general-workflow)
    - [Watch out for](#watch-out-for)

## Documentations

### Architecture

This application is built using the microsite "framework" built in IN Connected Marketing.

- An `express` server handles all site and API routes `express`, using `pug` templates to dynamically generate markup
- `gulp` compiles SCSS files into one output CSS file
- MySQL for database storage
- Some assets may be stored in S3

The application is hosted on Elastic Beanstalk under the `digitaladmin@upshotmail.com` user.

### Local Setup

### Requirements

- `node` version 8
- MySQL, optionally with MySQLWorkbench

### Setup

- Ensure the database is running locally using the sqldump found at the root of this project
  - If using MySQLWorkbench, create DB using the following steps:
    - Create a schema, making sure to name it the same as the expected DB name in the sqldump, if there is one
    - `File -> Run SQL Script`, choose the sqldump
    - Choose the newly created schema as the Default Schema Name
    - Run
- Specify Database host (probably `localhost`), username (set in MySQLWorkbench), and password (set in MySQLWorkbench) in `.env`, using `config.js` to inform what the names of the fields should be
- Ensure `node` version 8, perhaps using `nvm`
- `npm install`
- `npm run dev`
- You should have the app running at `localhost:3000`. If there are errors in the terminal, you may be missing some fields from `.env`. The errors should inform you regarding what you are missing. It is most likely a Mailgun credential, for which you can probably use dummy values locally. If you would like to use the environment variables used in the staging or production environments, you can view them in each instance's Elastic Beanstalk config in the AWS console under `Software`.

### Connecting to a remote staging or production Elastic Beanstalk database

In MySQLWorkbench,

- Name the connection in `Connection Name`
- `Connection method`: `Standard TCP/IP over SSH`
- `SSH Hostname` - `Public DNS (IPv4)` of a **running** instance of EC2 associate with the desired Beanstalk instance. To locate: In AWS, select `Services` from top nav. Select `EC2` > `Running Instances` > Find the instance you're looking for (be conscious of selecting the proper environment) and click the Name. Public DNS (IPv4) will be located on the top right in the Description tab.
- `SSH Username` - `ec2-user`
- `SSH Key File` - `rfrf-stage.pem` at root of this project
- `SSH Password` - found in `smithfield db.rtf` at the root of this project
- `MySQL Hostname` - Navigate to the Beanstalk instance. Within `Configuration` tab, find `Database` > `Modify`.   Copy the `Endpoint`, leaving out the port like `:3306`. ** When you're copying the endpoint, make sure to highlight and copy the text yourself. If you use the copy button next to the endpoint address or right click the link to copy the address, you will end up with the wrong endpoint. **
- `MySQl Server Port` - `3306`
- `username` - `upshot`
- Hit `Test Connection`. You may be prompted for the SSH password again. Aftering entering it in, if you get a dialog window that says "Connection successful", you're all set!

**Note**: Sometimes, you will lose access to the database you're connected to. This may because the EC2 instance you were connected to is no longer running. To reconnect, find a running EC2 instance for the Beanstalk instance and modify your MySQLWorkbench configuration to use that instead.


### Importing and Exporting SQL Dumps
Whenever you change data in your local version of the database and would like to deploy those changes into the production environment, you'll need to export the database as a sql dump. 

To Export:
- From your local instance in MySQL Workbench, select `Server` > `Data Export` from the menu bar. 
- Select the appropriate schema
- Select Export to Self-Contained File, and choose the location you'd like to save the dump to. (Makes sense to save it in the repository, and include the date in the file name. Ex: Dump20200113 if the date was Jan 13 2020)
- Start Export

To Import: 
- From your staging instance in MySQL Workbench, select `Server` > `Data Export` from the menu bar.
- Import from Self-Contained File, select the Dump.sql file you exported. 
- Default Target Schema: ebdb
- Start Import.
** If this doesn't work, check the schema and make sure the tables live under ebdb and not one of the other schemas. ** 


### Deployment

Use the Elastic Beanstalk CLI to push to staging. Run `eb init` at the root of the project to configure which instance this project should point to. A common workflow is to deploy to staging from the CLI, but deploy to production from the AWS console. This is purely for safety, but you can deploy it directly from the CLI as well if you so desire.

When you first use the Elastic Beanstalk CLI, you will be prompted for some credentials. You can't find them in `accessKeys.csv` at the root of this project.

- You'll be prompted to select a default region. Select 1 for US East
- When it asks if you'd like to continue with CodeCommit, choose n. 
- Run `eb deploy` (if you want to verify that you're deploying to the correct environment, you can specify the desired environment by appending it to eb deploy like so: `eb deploy SmokinWithSmithfield-staging`)
- Once it's done, click the URL link in the Elastic Beanstalk instance (in the Dashboard tab at the top) to see the changes. 

To make a deployment via the AWS Console

- Navigate to `Services -> Elastic Beanstalk -> project name -> any of the environments -> Upoad and Deploy -> Application Versions page`
- Check the application version to be deployed. If you have already deployed the new version to a staging environment, it should show up here.
- `Actions -> Deploy`
- Choose desired environment under `Environment`
- Deploy

### General Workflow

Most of the work on Smithfield microsites is updating copy, toggling features, or slight style modifications. To find the rendered template for a given page, search the `express` route declaration for that route and see which template is being rendered. If the template is `subpage`, the value of `intent` on the `controller` object being passed to the `render` function will further inform which template is being rendered. Since there is a lot of toggling to do on these sites, expect to find a lot of commented out code that may need to be uncommented in the future, and expect to do a lot of the same while working on requests as well.

### Watch out for

Watch out for hard coded dates at the top of `express` route files which are used to turn campaigns on and off. Ideally, either these campaigns should be manually turned off or these magic dates should live in a more visible location, such as a database table that is exposed to the admin panel. For now, this is the system we have.

Also watch out for inline styles sometimes found inside of the `pug` templates. These were done for quick overrides at some point, and their source can look mysterious when trying to debug.

### To change the pins on the map on home page
The map is populated with data that lives in the database. Whether or not the points are visible is determined by the date of the event in comparison to today's date -- past events are hidden automatically. The location of each marker is hard coded and placed by us using css. 
- To change / add new events, access the `events` table in MySql Workbench. Right Click events and choose `Select Rows - limit 1000`
- When adding new events to the map, check to see if there are any events in the events table that have the same city and state as the event you need to input. If so, you can change the date / description to match your new event, and keep event_posLeft and event_posTop the same, as they've already been applied to the map in the correct location. 
- If there is not an existing event with the same city and state, you need to manually add in the event & details, and use event_posLeft and event_posTop to place the marker appropriately on the map. In the Inspector in Google, modify the top & left values to determine placement. Then plug them in on the database. 
- Once your data is plugged in, select `Apply`  > `Apply` > close. Refresh the page in the browser to verify the point has been added in the correct location. 