## Harisenin Mission: Adv Backend B

#### Tech Stack

|                    |                     |
| ------------------ | ------------------- |
| Nodejs             | #runtime            |
| Mysql              | #database           |
| Sequelize          | #mysql ORM          |
| Express            | #handle REST API    |
| Jsonwebtoken       | #handle auth        |
| Cookie-parser      | #parse cookie       |
| Nodemailer         | #send email         |
| Express-fileupload | #handle file upload |

#### Structure Folder

```
chill-adv-be
┣ src
┃ ┣ config
┃ ┃ ┣ database.js
┃ ┃ ┗ email.js
┃ ┣ controllers
┃ ┃ ┣ auth.controller.js
┃ ┃ ┣ genres.controller.js
┃ ┃ ┣ movies.controller.js
┃ ┃ ┗ users.controller.js
┃ ┣ middleware
┃ ┃ ┣ verify.account.js
┃ ┃ ┣ verify.file.js
┃ ┃ ┣ verify.role.js
┃ ┃ ┗ verify.token.js
┃ ┣ models
┃ ┃ ┣ genres.model.js
┃ ┃ ┣ movies.model.js
┃ ┃ ┣ user.verifications.model.js
┃ ┃ ┗ users.model.js
┃ ┣ public
┃ ┃ ┗ images
┃ ┃ ┃ ┣ posters
┃ ┃ ┃ ┃ ┗ default.png
┃ ┃ ┃ ┗ users
┃ ┃ ┃ ┃ ┗ default.png
┃ ┣ routes
┃ ┃ ┣ auth.route.js
┃ ┃ ┣ genres.route.js
┃ ┃ ┣ movies.route.js
┃ ┃ ┗ users.route.js
┃ ┣ utils
┃ ┃ ┣ send.email.js
┃ ┃ ┗ sync.databse.js
┃ ┗ index.js
┣ .env.example
┣ .gitignore
┣ package-lock.json
┣ package.json
┗ README.md
```
