const router = require('express').Router()
const mongoose = require('mongoose')
require('../models/Usuario')
const Usuario = mongoose.model('usuarios')
const bcrypt = require('bcryptjs')
const passport = require('passport')
require('../models/Relatos')
require('../models/Blogs')
const Relato = mongoose.model('relatos')
const Blog = mongoose.model('blogs')
require('../models/Categoria')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

//Definindo armazenamento para imagens
const storage = multer.diskStorage({
  destination: (req, file, callback) =>{
    callback(null, './uploads')
  },
  filename: (req, file, callback)=>{
    callback(null,file.fieldname +'_' +Date.now()+'_' + file.originalname)
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req,file, callback)=>{
    if(
      file.mimetype == 'image/png'
       || file.mimetype == 'image/jpg'
       || file.mimetype == 'image/jpeg'
    ){
      callback(null, true)
    }else{
      console.log('onply jpg & png file supported !')
      callback(null, false)
    }
  },
  limits:{
    fieldSize: 1024*1024*2,
  },
});


//Pegando a referência do model
const Categoria = mongoose.model('categorias')

router.get('/registro', (req,res)=>{
  res.render('usuarios/registro')
})

router.post('/registro', (req,res)=>{
  let erros =[]

  if(!req.body.nome || req.body.nome == undefined || req.body.nome == null){
    erros.push({texto: 'Nome inválido!'})
  }
  if(!req.body.email || req.body.email == undefined || req.body.email == null){
    erros.push({texto: 'E-mail inválido!'})
  }
  if(!req.body.senha || req.body.senha == undefined || req.body.senha == null){
    erros.push({texto: 'Senha inválida!'})
  }
  
  if(req.body.senha != req.body.senha2){
    erros.push({texto: 'As senhas são diferentes, tente novamente!'})
  }
  if(erros.length > 0){
    res.render('usuarios/registro', {erros: erros})
  }else{
    Usuario.findOne({email: req.body.email}).lean().then((usuario)=>{
      if(usuario){
        req.flash('error_msg', 'Já existe uma conta com esse e-mail em nosso sitema!')
        res.redirect('/usuarios/registro')
      }else{
        const novoUsuario = new Usuario({
          nome: req.body.nome,
          email: req.body.email,
          senha: req.body.senha
        })

        bcrypt.genSalt(10,(erro,salt)=>{
          bcrypt.hash(novoUsuario.senha,salt,(erro,hash)=>{
            if(erro){
              req.flash('error_msg','Houve um erro durante o salvamento do usuário!')
              res.render('usuarios/login')
            }

            novoUsuario.senha = hash

            novoUsuario.save().then(()=>{
              req.flash('success_msg', 'Usuário criado com sucesso!')
              res.render('usuarios/login')
            }).catch((error)=>{
              req.flash('error_msg','Houve um erro ao criar o usuário, tente novamente!')
              res.redirect('/usuarios/registro')
            })
          })
        })
      }
    }).catch((error)=>{
      req.flash('error_msg','Houve um erro interno!')
      res.redirect('/registro')
    })
  }
})
router.get('/login', (req,res)=>{
  res.render('usuarios/login')
})

router.post('/login', (req,res,next)=>{
  let erros2 =[]

  if(!req.body.email || req.body.email == undefined || req.body.email == null){
    erros2.push({texto2: 'E-mail inválido!'})
  }
  if(!req.body.senha || req.body.senha == undefined || req.body.senha == null){
    erros2.push({texto2: 'Senha inválida!'})
  }
  
  if(erros2.length > 0){
    res.render('usuarios/login', {erros2: erros2})
  }
    passport.authenticate('local',{
      successRedirect: '/',
      failureRedirect: '/usuarios/login',
      failureFlash: true
    })(req,res,next)    
})

router.get("/logout", (req,res,next)=>{
  req.logOut((err)=>{
      if(err){return next(err)}    
  req.flash('success_msg', "Deslogado com sucesso!")
  res.redirect("/")
  })
})
router.get('/blogs', (req,res) =>{
  Blog.find().lean().then((blogs)=>{
    res.render('usuarios/blogs', {blogs: blogs})
  }).catch((error)=>{
    req.flash('error_msg', 'Houve um erro ao listar os relatos')
    res.redirect('/usuarios')
  })
})

router.get("/blogs/add", (req, res) => {
  Categoria.find().lean().then((categorias) => {
    res.render("usuarios/addblogs", {categorias: categorias})
  }).catch((err) => {
     req.flash("error.msg", "Houve um erro ao carregar o formulário!")
     res.redirect("/usuarios")
  })
});
router.post('/blogs/novo', upload.single('image'),(req,res)=> {
  console.log(req.file)
    const novoBlog = {
      title : req.body.title,
      name : req.body.name,
      text : req.body.text,
      image: req.file.filename
    }
  
    new Blog(novoBlog).save().then(()=>{
      req.flash('success_msg', 'Blog criado com sucesso!')
      res.redirect('/usuarios/blogs')
    }).catch((error)=>{
      console.log(error)
      req.flash('error_msg', 'Houve um erro ao salvar o blog tente novamente!')
      res.redirect("/")
    })
})

router.get('/blogs/edit/:id', (req,res)=>{
  
  Blog.findOne({_id: req.params.id}).lean().then((relatos)=>{
    Categoria.find().lean().then((categorias)=>{
      res.render('usuarios/editablogs')
    }).catch((error)=>{
      console.log(error)
      req.flash('error_msg', 'Houve um erro ao listar as categorias!')
      res.redirect('/usuarios/blogs')
    })
  }).catch((error)=> {
    req.flash('error_msg', 'Houve um erro ao carregar o formulário de edição!')
  })
  
})

router.post('/blogs/edit',  upload.single('image'),(req,res)=>{
  let id = req.body.id
  var new_image = ''

  if(req.file){
    new_image = req.file.filename;
    try{
      fs.unlinkSync('./uploads/' + req.body.old_image)
    }catch(err){
      console.log(err)
    }
  }else{
    new_image = req.body.old_image
  }
  Blog.findOne({_id: id}).then((blog)=>{
    blog.titulo = req.body.titulo
    blog.name = req.body.name
    blog.texto = req.body.texto
    blog.image = new_image

    blog.save().then(()=>{
      req.flash('success_msg', 'Relato atualizado com sucesso!')
      res.redirect('/usuarios/blog')
    }).catch((error)=>{
      req.flash('error_msg', 'Erro do sistema')
      res.redirect('/usuarios/blog')
    })
  }).catch((error) =>{
    console.log(error)
    req.flash('error_msg', 'Houve um erro ao salvar a edição')
    res.redirect('/usuarios/blogs')
  })
})

router.get('/blogs/deletar/:id', upload.single('image'),(req,res)=>{
  Blog.remove({_id: req.params.id}).then(()=>{
    req.flash("success_msg", 'Blog deletado com sucesso!')
    res.redirect('/usuarios/blogs')
  }).catch((error)=>{
    req.flash('error_msg', 'Houve um erro ao tentar deletar!')
    res.redirect('/usuarios/blog')
  })
})

router.get('/nossoapp',(req,res)=>{
  res.render('usuarios/nossoapp')
})
router.get('/lojas',(req,res)=>{
  res.render('usuarios/lojas') 
})
router.get('/blog',(req,res)=>{
  res.render('usuarios/blog') 
})
module.exports = router