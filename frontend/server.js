import jsonServer from 'json-server'

const server = jsonServer.create()
const router = jsonServer.router('src/data/data.json')
const middlewares = jsonServer.defaults()

server.use(middlewares)
server.use(router)
server.listen(3001, () => {
  console.log('Server running at http://localhost:3001')
})