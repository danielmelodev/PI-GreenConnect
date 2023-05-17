const express = require('express')
const handlebars = require('express-handlebars')
const bodyParser = require('body-parser')
const app = express()
const admin = require('./routes/admin')
const path = require('path')
const mongoose = require('mongoose')
const session = require('express-session')
const flash = require('connect-flash')
require('./models/Blogs')
const Blog = mongoose.model('blogs')
require('./models/Categoria')
const Categoria = mongoose.model('categorias')
const usuarios = require('./routes/usuarios')
const passport = require('passport')
const { initialize } = require('passport')
require('./config/auth')(passport)
require('./config/db')
require('dotenv').config();
//Configurações
  //Sessão
    app.use(session({
      secret: 'newreports',
      resave: true,
      saveUninitialized: true
    }))
    app.use(passport.initialize())
    app.use(passport.session())
    app.use(flash())
  //Middleware
    app.use((req,res,next)=>{
      res.locals.success_msg = req.flash('success_msg')
      res.locals.error_msg = req.flash('error_msg')
      res.locals.error = req.flash('error')
      res.locals.user = req.user || null
      next()
    })
  //BodyParser
    app.use(bodyParser.urlencoded({extended: true}))
    app.use(bodyParser.json())
  //Handlebars
    app.engine('handlebars', handlebars.engine({defaultLayout : 'main'}))
    app.set('view engine', 'handlebars')

  //Mongoose
    // mongoose.Promise = global.Promise;
    // mongoose.connect(db.mongoURI)
    // .then(()=>{
    //   console.log('Conectado ao MongoDB!')
    // }).catch((error)=>{
    //   console.log("Erro ao tentar se conectar ao MongoDB: " + error)
    // })
 
  //Public
    app.use(express.static(path.join(__dirname, 'public')))
//Rotas
  app.get('/', (req, res)=>{
    Blog.find().lean().populate('categoria').sort({data: 'desc'}).then((blogs)=>{
      res.render('index', {blogs: blogs})
    }).catch((error)=>{
      req.flash('error_msg', 'Houve um erro interno!')
      res.redirect('/404')
    })
  })
  app.get('/blogs/:id', (req,res)=>{
    Blog.findOne({_id: req.params.id}).lean().then((blogs)=>{
      if(relatos){
        res.render('blogs/index', {blogs: blogs})
      }else{
        req.flash('error_msg', 'Essa postagem não existe!')
        res.redirect('/')
      }
    }).catch((error)=>{
      req.flash('error_msg', 'Houve um erro interno!')
      res.redirect('/')
    })
  })

  app.get('/categorias', (req,res)=>{
    Categoria.find().lean().then((categorias)=>{
      res.render('categorias/index', {categorias: categorias})
    }).catch((error)=>{
      req.flash('error_msg','Houve um erro interno ao listar as categorias')
      res.redirect('/')
    })
  })

  app.get('/categorias/:slug', (req,res)=>{
    Categoria.findOne({slug: req.params.slug}).lean().then((categoria)=>{
      if(categoria){
        Relatos.find({categoria: categoria._id}).lean().then((relatos)=>{
          res.render('categorias/relatos',{relatos: relatos, categoria: categoria })
        }).catch((error)=>{
          req.flash('error_msg', 'Houve um erro ao listar os relatos!')
        })
      }else{
        console.log(error)
        req.flash('error_msg', 'Essa categoria não existe!')
        res.redirect('/')
      }
    }).catch((error)=>{
      req.flash('error_msg', 'Houve um erro interno!')
      res.redirect('/')
    })
  })


  app.get('/404', (req,res)=>{
    res.send('Erro 404!')
  })
  app.use('/admin', admin)
  app.use('/usuarios', usuarios)
  app.use('/uploads', express.static('uploads'))

//Outros
const PORT = process.env.PORT || 8090;
app.listen(PORT, () => console.log(`Server is running in port ${PORT}`));