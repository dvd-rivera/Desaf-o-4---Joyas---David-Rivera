const express = require('express')
const app = express()
const cors = require('cors')
const { Pool } = require('pg')

app.listen(3000, console.log('¡Servidor encendido!'))

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

const pool = new Pool({
    host: 'localhost',
    user: 'postgres',
    password: 'Clave_SQL',
    database: 'joyas',
    allowExitOnIdle: true,
})

const logger = (req, res, next) => {
    console.log(`Ruta ${req.method} ${req.url} accedida`)
    next()
}
app.use(logger)

app.get('/joyas', async (req, res) => {
    try {
        const { limits, page = 1, order_by = 'id_ASC' } = req.query
        const offset = (page - 1) * (limits || 10)

        const [field, direction] = order_by.split('_')

        let query = `SELECT * FROM inventario ORDER BY ${field} ${direction}`
        const values = []

        if (limits) {
            query += ' LIMIT $1 OFFSET $2'
            values.push(limits, offset)
        }

        const result = await pool.query(query, values)

        const response = {
            total: result.rowCount,
            data: result.rows,
            links: {
                self: `/joyas?limits=${limits}&page=${page}&order_by=${order_by}`,
                next: `/joyas?limits=${limits}&page=${
                    parseInt(page) + 1
                }&order_by=${order_by}`,
                previous: `/joyas?limits=${limits}&page=${
                    parseInt(page) - 1 > 0 ? page - 1 : 1
                }&order_by=${order_by}`,
            },
        }

        res.json(response)
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener joyas' })
    }
})

app.get('/joyas/filtros', async (req, res) => {
    try {
        const { precio_min, precio_max, categoria, metal } = req.query
        let query = 'SELECT * FROM inventario WHERE 1=1'
        const values = []

        if (precio_min) {
            query += ' AND precio >= $' + (values.length + 1)
            values.push(precio_min)
        }
        if (precio_max) {
            query += ' AND precio <= $' + (values.length + 1)
            values.push(precio_max)
        }
        if (categoria) {
            query += ' AND categoria = $' + (values.length + 1)
            values.push(categoria)
        }
        if (metal) {
            query += ' AND metal = $' + (values.length + 1)
            values.push(metal)
        }

        const result = await pool.query(query, values)
        res.json(result.rows)
    } catch (error) {
        res.status(500).json({ error: 'Error al filtrar joyas' })
    }
})
