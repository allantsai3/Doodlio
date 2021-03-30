### Node Express template project

This project is based on a GitLab [Project Template](https://docs.gitlab.com/ee/gitlab-basics/create-project.html).

## Showcase
Game lobby with two connected hosts
![image](https://user-images.githubusercontent.com/31875809/112943049-d3304a80-90e5-11eb-97cb-792b735195e8.png)


## Development

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

## Test with
``` 
yarn run test
```

To connect to database in local development,
1. Install Google Cloud SDK
```
https://cloud.google.com/sdk/docs/install
```

2. Run following command and sign in with doodlio@gmail.com
```
gcloud auth login
```

3. Verify doodlio@gmail.com account is active by running the following.
```
gcloud auth list
```

4. Install the Cloud SQL Proxy client on your local machine
```
https://cloud.google.com/sql/docs/mysql/quickstart-proxy-test
```

5. execute the database listener
```
./cloud_sql_proxy -instances=cmpt470project-294201:us-west1:doodliodata=tcp:3306
```

## Turning the instance on/off
If you can't connect to the database, the Cloud SQL instance might be off. Follow these steps to reach the Overview for the instance:
1. Go to the GCP console for doodlio470@gmail.com, make sure your active project is "CMPT470Project"
2. In the Navigation menu on the left, scroll down to the Databases section and click on "SQL"
3. Click "doodliodata" under Instance ID in the instances table
At the top of the screen are various buttons, one of which is a Start/Stop button. If the instance is off, click "Start" to turn the instance on to be able to access the database. **Make sure to turn it back off once you are done.**
