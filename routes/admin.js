const router = require('express').Router()

//Pegando o mongoose e adicionando seu models.
const mongoose = require('mongoose')
require('../models/Categoria')
//Pegando a referência do model
const Categoria = mongoose.model('categorias')


const {eAdmin} = require('../helpers/eAdmin')

router.get('/', (req,res) => {
  res.render('admin/index')
})

router.get('/reports',eAdmin, (req,res)=>{
  res.send('Página de relatos')
} )

router.get('/categorias',eAdmin, (req,res)=> {
  Categoria.find().sort({date: 'desc'}).lean().then((categorias)=>{
    res.render('admin/categorias', {categorias: categorias})
  }).catch((error)=>{
    req.flash('error_msg', 'Houve um erro ao listar as categorias')
    res.redirect('/admin')
  })
})
router.get('/categoria/add',eAdmin, (req,res) => {
  res.render('admin/addcategorias')
})
router.post('/categorias/nova',eAdmin, (req,res)=>{

  var erros = []
  if(!req.body.nome || req.body.nome == undefined || req.body.nome == null){
    erros.push({texto: "Nome inválido!"})
  }

  if(!req.body.slug || req.body.slug == undefined || req.body.slug == null){
    erros.push({texto: "Slug inválido"})
  }

  if(req.body.nome.length < 2){
    erros.push({texto: "Nome da categoria é muito pequeno!"})
  }

  if(erros.length > 0){
    res.render('admin/addcategorias', {erros: erros})
  }else{
    const novaCategoria = {
      nome: req.body.nome,
      slug: req.body.slug
    }
  
    new Categoria(novaCategoria).save().then(()=>{
      req.flash('success_msg', 'Categoria criada com sucesso!')
      res.redirect('/admin/categorias')
    }).catch((error)=>{
      req.flash('error_msg', 'Houve um erro ao salvar a categoria, tente novamente!')
      res.redirect("/admin")
    })
  }
  
})

router.get('/categorias/edit/:id',eAdmin, (req,res)=>{
  Categoria.findOne({_id: req.params.id}).lean().then((categoria)=>{
    res.render('admin/editacategoria', {categoria: categoria})
  }).catch((error)=>{
      req.flash('error_msg', 'Está categoria não existe!')
      res.redirect('/admin/categorias')
  })
})

router.post("/categorias/edit",eAdmin, (req, res) => {
  Categoria.findOne({ _id: req.body.id }).lean().then((categoria) => {
      let erros = []

      if (!req.body.nome || req.body.nome == undefined || req.body.nome == null) {
        erros.push({ texto: 'Nome invalido' })
      }
      if (!req.body.slug || req.body.slug == undefined || req.body.slug == null) {
        erros.push({ texto: 'Slug invalido' })
      }
      if (req.body.nome.length < 2) {
        erros.push({ texto: 'Nome da categoria muito pequeno' })
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


module.exports = router