### Node Express template project

This project is based on a GitLab [Project Template](https://docs.gitlab.com/ee/gitlab-basics/create-project.html).

Improvements can be proposed in the [original project](https://gitlab.com/gitlab-org/project-templates/express).

### CI/CD with Auto DevOps

This template is compatible with [Auto DevOps](https://docs.gitlab.com/ee/topics/autodevops/).

If Auto DevOps is not already enabled for this project, you can [turn it on](https://docs.gitlab.com/ee/topics/autodevops/#enabling-auto-devops) in the project settings.

## Usage

# First time setup
Make sure yarn is installed on your system through the following:
https://classic.yarnpkg.com/en/docs/install/#debian-stable

Once yarn is installed:
```
yarn install
```

# Run the node server
``` 
yarn run start
```

# For development mode
```
yarn run dev
```

To connect to database in local development,
1. Install the Cloud SQL Proxy client on your local machine
```
https://cloud.google.com/sql/docs/mysql/quickstart-proxy-test
```

2. execute the database listener
```
./cloud_sql_proxy -instances=cmpt470project-294201:us-west1:doodliodata=tcp:3306
```

## Test with
``` 
yarn run test
```

## Turning the instance on/off
If you can't connect to the database, the Cloud SQL instance might be off. Follow steps 1-3 above to reach the Overview for the instance. At the top of the screen are various buttons, one of which is a Start/Stop button. If the instance is off, click "Start" to turn the instance on to be able to access the database. Make sure to turn it back off once you are done.