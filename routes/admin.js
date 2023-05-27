const router = require('express').Router()
const bcrypt = require('bcryptjs')
//Pegando o mongoose e adicionando seu models.
const mongoose = require('mongoose')
require('../models/Parceiros')
require('../models/Usuario')
//Pegando a referência do model
const Parceiros = mongoose.model('parceiros')
const Usuario = mongoose.model('usuarios')
const multer = require('multer')
const passport = require('passport')
const path = require('path')
const fs = require('fs')

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
       || file.mimetype == 'image/gif'
    ){
      callback(null, true)
    }else{
      console.log('onply jpg & png file supported !')
      callback(null, false)
    }
  },
  limits:{
    fieldSize: 2024*2024*2,
  },
});



router.get('/', (req,res) => {
  res.render('admin/index')
})

router.get('/parceiros', (req,res)=> {
  Parceiros.find().sort({date: 'desc'}).lean().then((parceiros)=>{
    res.render('admin/parceiros', {parceiros: parceiros})
  }).catch((error)=>{
    req.flash('error_msg', 'Houve um erro ao listar as categorias')
    res.redirect('/admin')
  })
})
router.get('/parceiros/add', (req,res) => {
  res.render('admin/addparceiros')
})
router.post('/parceiros/novo', upload.single('image'),(req,res)=> {
  console.log(req.file)
    const novoParceiro = {
      describe : req.body.describe,
      corporatename : req.body.corporatename,
      cnpj : req.body.cnpj,
      image: req.file.filename,
      redesocial: req.body.redesocial
    }
  
    new Parceiros(novoParceiro).save().then(()=>{
      req.flash('success_msg', 'Parceiro registrado com sucesso!')
      res.redirect('/admin/parceiros')
    }).catch((error)=>{
      console.log(error)
      req.flash('error_msg', 'Houve um erro ao salvar o parceiro, tente novamente!')
      res.redirect("/")
    })
})

router.get('/parceiros', (req,res) =>{
  Parceiros.find().lean().then((parceiros)=>{
    res.render('admin/parceiros', {parceiros: parceiros})
  }).catch((error)=>{
    req.flash('error_msg', 'Houve um erro ao listar os Artigos')
    res.redirect('/usuarios')
  })
})


router.get('/parceiros/edit/:id', (req,res)=>{
  Parceiros.findOne({_id: req.params.id}).lean().then((parceiros)=>{
    res.render('admin/editparceiros', {parceiros: parceiros})
  }).catch((error)=>{
      req.flash('error_msg', 'Este parceiro não existe!')
      res.redirect('/admin/parceiros')
  })
})

router.post("/parceiros/edit", (req, res) => {
  Categoria.findOne({ _id: req.body.id }).lean().then((categoria) => {
      let erros = []

      if (!req.body.nome || req.body.nome == undefined || req.body.nome == null) {
        erros.push({ texto: 'Nome invalido' })
      }
      if (!req.body.slug || req.body.slug == undefined || req.body.slug == null) {
        erros.push({ texto: 'Slug invalido' })
      }
      if (req.body.nome.length < 2) {
        erros.push({ texto: 'Nome muito pequeno' })
      }
      if (errosEdit.length > 0) {
          Categoria.findOne({ _id: req.body.id }).lean().then((categoria) => {
              res.render("admin/editacategoria", { categoria: categoria})
          }).catch((err) => {
              req.flash("error_msg", "Erro ao pegar os dados")
              res.redirect("admin/categorias")
          })
          
      } else {
          categoria.nome = req.body.nome
          categoria.slug = req.body.slug

          categoria.save().then(() => {
              req.flash("success_msg", "Categoria editada com sucesso!")
              res.redirect("/admin/categorias")
          }).catch((err) => {
              req.flash("error_msg", "Erro ao salvar a edição da categoria")
              res.redirect("/admin/categorias")
          })

      }
  }).catch((err) => {
      req.flash("error_msg", "Erro ao editar a categoria")
      req.redirect("/admin/categorias")
  })
})
router.get('/registro', (req,res)=>{
  res.render('admin/registro')
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
    res.render('admin/registro', {erros: erros})
  }else{
    Usuario.findOne({email: req.body.email}).lean().then((usuario)=>{
      if(usuario){
        req.flash('error_msg', 'Já existe uma conta com esse e-mail em nosso sitema!')
        res.redirect('/admin/registro')
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
              res.redirect('/admin/registro')
            })
          })
        })
      }
    }).catch((error)=>{
      req.flash('error_msg','Houve um erro interno!')
      console.log(error)
      res.redirect('/registro')
    })
  }
})


module.exports = router