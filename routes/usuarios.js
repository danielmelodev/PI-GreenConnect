const router = require('express').Router()
const mongoose = require('mongoose')
require('../models/Usuario')
const Usuario = mongoose.model('usuarios')
const bcrypt = require('bcryptjs')
const passport = require('passport')
require('../models/Relatos')
const Relato = mongoose.model('relatos')
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
router.get('/relatos', (req,res) =>{
  Relato.find().lean().populate('categoria').sort({data: 'desc'}).then((relatos)=>{
    res.render('usuarios/relatos', {relatos: relatos})
  }).catch((error)=>{
    req.flash('error_msg', 'Houve um erro ao listar os relatos')
    res.redirect('/usuarios')
  })
})

router.get("/relatos/add", (req, res) => {
  Categoria.find().lean().then((categorias) => {
    res.render("usuarios/addrelatos", {categorias: categorias})
  }).catch((err) => {
     req.flash("error.msg", "Houve um erro ao carregar o formulário!")
     res.redirect("/usuarios")
  })
});
router.post('/relatos/nova', upload.single('image'),(req,res)=> {
  console.log(req.file)
    const novoRelato = {
      titulo : req.body.titulo,
      setor : req.body.setor,
      descricao : req.body.descricao,
      categoria : req.body.categoria,
      image: req.file.filename
    }
  
    new Relato(novoRelato).save().then(()=>{
      req.flash('success_msg', 'Relato criado com sucesso!')
      res.redirect('/usuarios/relatos')
    }).catch((error)=>{
      console.log(error)
      req.flash('error_msg', 'Houve um erro ao salvar o relato tente novamente!')
      res.redirect("/")
    })
})

router.get('/relatos/edit/:id', (req,res)=>{
  
  Relato.findOne({_id: req.params.id}).lean().then((relatos)=>{
    Categoria.find().lean().then((categorias)=>{
      res.render('usuarios/editarelatos', {categorias: categorias, relatos: relatos})
    }).catch((error)=>{
      console.log(error)
      req.flash('error_msg', 'Houve um erro ao listar as categorias!')
      res.redirect('/usuarios/relatos')
    })
  }).catch((error)=> {
    req.flash('error_msg', 'Houve um erro ao carregar o formulário de edição!')
  })
  
})

router.post('/relatos/edit',  upload.single('image'),(req,res)=>{
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
  Relato.findOne({_id: id}).then((relato)=>{
    relato.titulo = req.body.titulo
    relato.setor = req.body.setor
    relato.descricao = req.body.descricao
    relato.categoria = req.body.categoria
    relato.image = new_image

    relato.save().then(()=>{
      req.flash('success_msg', 'Relato atualizado com sucesso!')
      res.redirect('/usuarios/relatos')
    }).catch((error)=>{
      req.flash('error_msg', 'Erro do sistema')
      res.redirect('/usuarios/relatos')
    })
  }).catch((error) =>{
    console.log(error)
    req.flash('error_msg', 'Houve um erro ao salvar a edição')
    res.redirect('/usuarios/relatos')
  })
})

router.get('/relatos/deletar/:id', upload.single('image'),(req,res)=>{
  Relato.remove({_id: req.params.id}).then(()=>{
    req.flash("success_msg", 'Relato deletado com sucesso!')
    res.redirect('/usuarios/relatos')
  }).catch((error)=>{
    req.flash('error_msg', 'Houve um erro ao tentar deletar!')
    res.redirect('/usuarios/postagens')
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