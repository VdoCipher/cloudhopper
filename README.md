# CloudHopper
Deploy your APIs with AWS Lambda

**Important : Under Construction**


### Why CloudHopper?

* **No vendor lock-in** Project can also be deployed as a normal express application.
* **Fast startup time** With a single function for all end-points, the API is not affected by cold-start latency.
* **No intrusive persmissions** The project is designed to just do the work of an application. It requires a finite set of IAM persmissions for setup. *This also means you need to do some configuration on AWS for this to work*
* **Local testing** Local functional test helper to make calls to API endpoints
* **Small deployment package** The deploy tool tries to create a smaller deployment package by only including the required files


#### Requirements
* NodeJS: 4.3 or greater

## Getting started

NPM init your package and add a `index.js`

```
npm i -S cloudhopper
```


Add the following scripts to your package.json

```json
"scripts" : {
	"deploy": "cloudhopper deploy"
}
```

Your index.js should look like this:
```json
'use strict';

let Router = require('router');
let router = Router();
let cloudhopper = require('cloudhopper')

router.get('/', (req, res) => {
	res.json({message: "Hello world"})
});
cloudhopper.use(router)
exports.handler = cloudhopper.handler

```
Create a new IAM user with the following permissions:
```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "apigateway:*"
            ],
            "Resource": [
                "arn:aws:apigateway:<region>::/restapis/<api-id>/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "lambda:UpdateFunctionCode"
            ],
            "Resource": [
                "arn:aws:lambda:<region>:<account-id>:function:<function-name>"
            ]
        }
    ]
}
```

Create a git-ignored file `local.cloudhopper.json` with the following:
```
{
	AWS_ACCESS_KEY_ID: "xxxxxxxxxxxxx",
	AWS_SECRET_ACCESS_KEY: "xxxxxxxxxx",
	lambda_function_name: "xxxxxx",
	apigateway_id: "xxxxx"
}
```

```
npm run deploy
```

This will setup the API Gateway and Lambda functions for you.

You should get a message like this:
`URL: https://xxxxxxxx.apigateway.com`


## Architecture

This framework bootstraps an API Gateway which will forward everything to the lambda function.
The lambda function operates from your VPC with no public DNS name. To connect to external network or a non-VPC endpoints or another region in your account, it requires a NAT Gateway/Instance with a private subnet.

The Request Response objects partially emulate the corresponding objects of Express Framework such that you can easily swap express instead of cloudhopper and run the project anywhere.


## Limitations

* Only JSON I/O
* No Cookie support


## FAQ

**1. Why have a single function for all API end-points?**

Lambda works on docker containers on AWS managed ec2 instances. If you do not call a Lambda function for sometime, the docker is destroyed. A fresh start will take extra time because a new docker will be set up with your code.


**2. Why not use the API Gateway end-points instead of having parameters?**

Since, we are using the same function for multiple end-points, we need to have
some kind of routing logic in the function itself. This makes the Gateway kind
of redundant.
Also, with API Gateway, non-existent end-points are returned with a wierd
"Missing Authwentication Error" which can not be overridden. This may not be
404 or 415 that you wish to return to your client. It is therefore better to
just use wildcards and forward everything to the client.


## License
GPL-3.0
