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
  destination: (req, file, callback) => {
    callback(null, './uploads')
  },
  filename: (req, file, callback) => {
    callback(null, file.fieldname + '_' + Date.now() + '_' + file.originalname)
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, callback) => {
    if (
      file.mimetype == 'image/png'
      || file.mimetype == 'image/jpg'
      || file.mimetype == 'image/jpeg'
      || file.mimetype == 'image/gif'
    ) {
      callback(null, true)
    } else {
      console.log('onply jpg & png file supported !')
      callback(null, false)
    }
  },
  limits: {
    fieldSize: 2024 * 2024 * 2,
  },
});



router.get('/', (req, res) => {
  res.render('admin/index')
})

router.get('/parceiros', (req, res) => {
  Parceiros.find().sort({ date: 'desc' }).lean().then((parceiros) => {
    res.render('admin/parceiros', { parceiros: parceiros })
  }).catch((error) => {
    req.flash('error_msg', 'Houve um erro ao listar as categorias')
    res.redirect('/admin')
  })
})
router.get('/parceiros/add', (req, res) => {
  res.render('admin/addparceiros')
})
router.post('/parceiros/novo', upload.single('image'), (req, res) => {
  console.log(req.file)
  const novoParceiro = {
    describe: req.body.describe,
    corporatename: req.body.corporatename,
    cnpj: req.body.cnpj,
    image: req.file.filename,
    redesocial: req.body.redesocial
  }

  new Parceiros(novoParceiro).save().then(() => {
    req.flash('success_msg', 'Parceiro registrado com sucesso!')
    res.redirect('/admin/parceiros')
  }).catch((error) => {
    console.log(error)
    req.flash('error_msg', 'Houve um erro ao salvar o parceiro, tente novamente!')
    res.redirect("/")
  })
})

router.get('/parceiros', (req, res) => {
  Parceiros.find().lean().then((parceiros) => {
    res.render('admin/parceiros', { parceiros: parceiros })
  }).catch((error) => {
    req.flash('error_msg', 'Houve um erro ao listar os Artigos')
    res.redirect('/usuarios')
  })
})


router.get('/parceiros/edit/:id', (req, res) => {
  Parceiros.findOne({ _id: req.params.id }).lean().then((parceiros) => {
    res.render('admin/editparceiros', { parceiros: parceiros })
  }).catch((error) => {
    req.flash('error_msg', 'Este parceiro não existe!')
    res.redirect('/admin/parceiros')
  })
})

router.get('/blogs/edit/:id', (req, res) => {

  Blog.findOne({ _id: req.params.id }).lean().then((blogs) => {
    res.render('usuarios/editablogs', { blogs: blogs })
  }).catch((error) => {
    console.log(error)
    res.redirect('/usuarios/blogs')
    req.flash('error_msg', 'Houve um erro ao carregar o formulário de edição!')
  })
})

router.post('/parceiros/edit', upload.single('image'), (req, res) => {
  let id = req.body.id
  var new_image = ''

  if (req.file) {
    new_image = req.file.filename;
    try {
      fs.unlinkSync('uploads/' + req.body.old_image)
    } catch (err) {
      console.log(err)
    }
  } else {
    new_image = req.body.old_image
  }
  Parceiros.findOne({ _id: id }).then((parceiros) => {
    parceiros.describe = req.body.describe,
    parceiros.corporatename = req.body.corporatename,
    parceiros.cnpj = req.body.cnpj,
    parceiros.image = req.file.filename,
    parceiros.redesocial = req.body.redesocial

    parceiros.save().then(() => {
      req.flash('success_msg', 'Parceiro atualizado com sucesso!')
      res.redirect('/admin/parceiros')
    }).catch((error) => {
      req.flash('error_msg', 'Erro do sistema')
      res.redirect('/admin/parceiros')
    })
  }).catch((error) => {
    console.log(error)
    req.flash('error_msg', 'Houve um erro ao salvar a edição')
    res.redirect('/admin/parceiros')
  })
})
router.get('/parceiros/deletar/:id', upload.single('image'),(req,res)=>{
  Parceiros.remove({_id: req.params.id}).then(()=>{
    req.flash("success_msg", 'Parceiro deletado com sucesso!')
    res.redirect('/admin/parceiros')
  }).catch((error)=>{
    req.flash('error_msg', 'Houve um erro ao tentar deletar!')
    res.redirect('/admin/parceiros')
  })
})

router.get('/registro', (req, res) => {
  res.render('admin/registro')
})

router.post('/registro', (req, res) => {
  let erros = []

  if (!req.body.nome || req.body.nome == undefined || req.body.nome == null) {
    erros.push({ texto: 'Nome inválido!' })
  }
  if (!req.body.email || req.body.email == undefined || req.body.email == null) {
    erros.push({ texto: 'E-mail inválido!' })
  }
  if (!req.body.senha || req.body.senha == undefined || req.body.senha == null) {
    erros.push({ texto: 'Senha inválida!' })
  }

  if (req.body.senha != req.body.senha2) {
    erros.push({ texto: 'As senhas são diferentes, tente novamente!' })
  }
  if (erros.length > 0) {
    res.render('admin/registro', { erros: erros })
  } else {
    Usuario.findOne({ email: req.body.email }).lean().then((usuario) => {
      if (usuario) {
        req.flash('error_msg', 'Já existe uma conta com esse e-mail em nosso sitema!')
        res.redirect('/admin/registro')
      } else {
        const novoUsuario = new Usuario({
          nome: req.body.nome,
          email: req.body.email,
          senha: req.body.senha
        })

        bcrypt.genSalt(10, (erro, salt) => {
          bcrypt.hash(novoUsuario.senha, salt, (erro, hash) => {
            if (erro) {
              req.flash('error_msg', 'Houve um erro durante o salvamento do usuário!')
              res.render('usuarios/login')
            }

            novoUsuario.senha = hash

            novoUsuario.save().then(() => {
              req.flash('success_msg', 'Usuário criado com sucesso!')
              res.render('usuarios/login')
            }).catch((error) => {
              req.flash('error_msg', 'Houve um erro ao criar o usuário, tente novamente!')
              res.redirect('/admin/registro')
            })
          })
        })
      }
    }).catch((error) => {
      req.flash('error_msg', 'Houve um erro interno!')
      console.log(error)
      res.redirect('/registro')
    })
  }
})


module.exports = router