require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const Person = require('./models/person')

morgan.token('person', function getInfo (req) {
    if (JSON.stringify(req.body).length > 0) {
        return JSON.stringify(req.body)
    }
    return null
})

const app = express()

app.use(express.static('build'))
app.use(express.json())
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :person', {
    skip: function (req,res) { return req.method != "POST"}
})) // Jos kyseessä POST pyyntö, tulostetaan lisäksi lisättävät tiedot
app.use(morgan('tiny', {
    skip: function (req,res) { return req.method === "POST"}
})) // Muuten tulostetaan vain tiny:n sisältämät tiedot
app.use(cors())

  app.get('/api/persons', (req, res) => {
    Person.find({}).then(people => {
      res.json(people)
    })
  })

  app.get('/info', (req, res) => {
    const today = new Date()
    Person.countDocuments({})
    .then(count => {
      res.send(
        `<div>
            <p>Phonebook has info for ${count} people</p>
            <p>${today.toString()}</p>
        </div>`
    )
    })
    
  })

  app.get('/api/persons/:id', (request, response, next) => {
    Person.findById(request.params.id)
      .then(person => {
        if (person) {
          response.json(person)
        } else {
          response.status(404).end()
        }
      })
      .catch(error => next(error))
  })

  app.delete('/api/persons/:id', (request, response, next) => {
    Person.findByIdAndRemove(request.params.id)
    .then(result => {
      response.status(204).end()
    })
    .catch(error => next(error))
  })

  app.put('/api/persons/:id', (request, response, next) => {
    const { name, number } = request.body

    Person.findByIdAndUpdate(
      request.params.id,
      { name, number },
      { new: true, runValidators:true, context:'query' }
      )
      .then(updatedPerson => {
        response.json(updatedPerson)
      })
      .catch(error => next(error))
  })
  
  app.post('/api/persons', (request, response, next) => {
    const body = request.body
  
    if (!body.name) { // Palauttaa virheen jossei nimeä ja numeroa ole annettu
      return response.status(400).json({
        error: 'name missing' 
      })
    }

    if (!body.number) {
        return response.status(400).json({ 
          error: 'number missing' 
        })
      }
  
    const person = new Person({ // Uuden henkilön luominen
      name: body.name,
      number: body.number
    })
  
    person.save().then(savedPerson => { // Tallennus tietokantaan
      response.json(savedPerson)
    })
    .catch(error => next(error))
  })

  const errorHandler = (error, request, response, next) => { // Virheiden keskittäminen middlewareen
    console.error(error.message)
  
    if (error.name === 'CastError') {
      return response.status(400).send({ error: 'malformatted id' })
    } else if (error.name === 'ValidationError') {
      return response.status(400).json({ error: error.message })
    }
  
    next(error)
  }

  app.use(errorHandler)

  const PORT = process.env.PORT
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })