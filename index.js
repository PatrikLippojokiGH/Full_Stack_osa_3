const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
morgan.token('person', function getInfo (req) {
    if (JSON.stringify(req.body).length > 0) {
        return JSON.stringify(req.body)
    }
    return null
})

const app = express()

app.use(express.json())
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :person', {
    skip: function (req,res) { return req.method != "POST"}
})) // Jos kyseessä POST pyyntö, tulostetaan lisäksi lisättävät tiedot
app.use(morgan('tiny', {
    skip: function (req,res) { return req.method === "POST"}
})) // Muuten tulostetaan vain tiny:n sisältämät tiedot
app.use(cors())
app.use(express.static('build'))

let persons = [
    {
        id: 1,
        name: "Arto Hellas",
        number: "040-123456"
    },
    {
        id: 2,
        name: "Ada Lovelace",
        number: "39-44-5323523"
    },
    {
        id: 3,
        name: "Dan Abramov",
        number: "12-43-234345"
    },
    {
        id: 4,
        name: "Mary Poppendick",
        number: "39-23-6423122"
    }
  ]

  app.get('/api/persons', (req, res) => {
    res.json(persons)
  })

  app.get('/info', (req, res) => {
    const today = new Date()
    res.send(
        `<div>
            <p>Phonebook has info for ${persons.length} people</p>
            <p>${today.toString()}</p>
        </div>`
    )
  })

  app.get('/api/persons/:id', (request, response) => {
    const id = Number(request.params.id)
    const person = persons.find(person => {
      console.log(person.id, typeof person.id, id, typeof id, person.id === id)
      return person.id === id
    })

    if (person) {
        response.json(person)
      } else {
        response.status(404).end()
      }
  })

  app.delete('/api/persons/:id', (request, response) => {
    const id = Number(request.params.id)
    persons = persons.filter(person => person.id !== id)
  
    response.status(204).end()
  })

  const generateId = () => {
    const newId = Math.floor(Math.random() * 10000)
    return newId
  }
  
  app.post('/api/persons', (request, response) => {
    const body = request.body
  
    if (!body.name) {
      return response.status(400).json({ 
        error: 'name missing' 
      })
    }

    if (!body.number) {
        return response.status(400).json({ 
          error: 'number missing' 
        })
      }

    if (persons.find(person => {
        return person.name === body.name
    })) {
        return response.status(400).json({ 
            error: 'name must be unique' 
          })
    }
  
    const person = {
      id: generateId(),
      name: body.name,
      number: body.number
    }
  
    persons = persons.concat(person)
  
    response.json(person)
  })

  const PORT = process.env.PORT || 3001
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })