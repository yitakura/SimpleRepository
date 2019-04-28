const express = require('express');
const ejs = require('ejs');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const logger = require('morgan');
const i18next = require('i18next');
const config = require('config');
const middleware = require('i18next-express-middleware');
const fsBackend = require('i18next-node-fs-backend');
const boom = require('boom');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const passport = require('passport');

const database = require('./model/database');
const repController = require('./controller/repController');
const authController = require('./controller/authController');

const app = express();

app.set('views', 'public');
app.set('view engine', 'ejs');
app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static('public'));
app.use(passport.initialize());
app.use(passport.session());

app.options('*', cors());

// Multi National
i18next
  .use(middleware)
  .use(fsBackend)
  .init({
    lng: 'ja',
    fallbackLng: 'ja',
    backend: {
      loadPath: 'public/locales/{{lng}}/{{ns}}.json'
    }
  });
app.use(middleware.handle(i18next));

// Documentation
const swaggerSpec = swaggerJSDoc({
  swaggerDefinition: {
    swagger: '2.0',
    info: {
      title: 'Simple Repository API',
      version: '1.2.0',
      description: 'Simple Repository API'
    },
    basePath: `/${config.get('appLabel')}/api`,
    consumes: ['application/json'],
    produces: ['application/json']
  },
  apis: ['./controller/repController.js', './controller/authController.js']
});
app.use(`/${config.get('appLabel')}/api/docs`, swaggerUi.serve);
app.get(`/${config.get('appLabel')}/api/docs`, swaggerUi.setup(swaggerSpec));

// API
app.use(`/${config.get('appLabel')}/api/rep`, repController);

// Auth
app.use(`/${config.get('appLabel')}/api/auth`, authController);

// Error
app.use((req, res, next) => {
  next(boom.notFound(i18next.t('errorNotFound')));
});
app.use((err, req, res, next) => {
  if (boom.isBoom(err)) {
    res.status(err.output.statusCode).json(err.output.payload);
  } else if (err instanceof TypeError) {
    res.status(403).json({
      StatusCode: 403,
      error: 'Invalid Request Parameter',
      message: err.message
    });
  } else {
    res.status(500).json({
      StatusCode: 500,
      error: 'Internal Server Error',
      message: err.message
    });
  }
});

// conntect dataase
database
  .connect()
  .then(() => {
    console.log('Connected to mongodb successfully');
  })
  .catch(err => {
    console.log(err);
  });

module.exports = app;