require("dotenv").config();
const { Router } = require("express");
const dbConnection = require('../db/db');
const router = Router();
const jwt = require("jsonwebtoken");
const dbService = require("../Services/DbService");

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
    try {
        let token = req.headers.authorization;
        if (!token) {
            return res.status(401).json({ error: "Unauthorized - Token not provided" });
        }
        token =  token.split(' ')[1];
        await jwt.verify(token, process.env.SECRET);
        
        next();
    } catch (error) {
        console.error('Error verifying token:', error);
        res.status(401).json({ error: "Unauthorized - Invalid token" });
    }
};

router.use(authenticateToken);

// Get all products
router.get("/all", async (req, res) => {
    try {
        const parameters = [];

        await dbService.common_db_call("usp_list_product", parameters, (err, result) => {
            if (err) {
                console.log("data service error: " + err);
                return res.status(500).send("data service error: " + err.message);
            }
            console.log(result);
            return res.status(200).json({ result })
        });

    } catch (error) {
        res.status(400).json({ error });
    }
});

// Get product by Id
router.get("/:id", async (req, res) => {
    try {
        const productId = req.params.id;

        if (isNaN(productId)) {
            return res.status(400).json({ error: 'Invalid product ID' });
        }

        const query = "CALL usp_get_product(?);"
        dbConnection.query(query, [productId], (error, results) => {
            if (error) {
                console.error('Error executing MySQL query:', error);
                return res.status(500).json({ error: 'Internal Server Error' });
            } else {
                return res.status(200).json(results);
            }
        });

    } catch (error) {
        res.status(400).json({ error });
    }
});

// Create product
router.post("/create", async (req, res) => {
    try {
        const { name, description, price } = req.body;
        if (!name || !price) {
            return res.status(400).json({ error: 'Name and Price are required' });
        }
        const parameters = [
            { ParamName: "name", Value: name, Direction: 0, DataType: "nvarchar" },
            { ParamName: "description", Value: description, Direction: 0, DataType: "nvarchar" },
            { ParamName: "price", Value: price, Direction: 0, DataType: "int" }
        ];

        await dbService.common_db_call("usp_ins_product", parameters, (err, result) => {
            if (err) {
                console.log("data service error: " + err);
                return res.status(500).send("data service error: " + err.message);
            }
            console.log(result);
            return res.status(200).json({ message: "Created successfully!", name: name, description: description, price: price })
        });
    } catch (error) {
        res.status(400).json({ error: error });
    }
});

// Update product
router.put("/update/:id", async (req, res) => {
    try {
        const productId = req.params.id;
        if (isNaN(productId)) {
            return res.status(400).json({ error: 'Invalid product ID' });
        }

        const { name, description, price } = req.body;
        if (!name || !price) {
            return res.status(400).json({ error: 'Name and Price are required' });
        }

        const query = 'CALL usp_upd_product(?, ?, ?, ?);';

        dbConnection.query(query, [productId, name, description, price], (error, results) => {
            if (error) {
                console.error('Error executing MySQL query:', error);
                return res.status(500).json({ error: 'Internal Server Error' });
            } else {
                return res.status(201).json({ id: results.id, name, description, price });
            }
        });
    } catch (error) {
        res.status(400).json({ error });
    }
});

// Get product by Id
router.delete("/:id", async (req, res) => {
    try {
        const productId = req.params.id;

        if (isNaN(productId)) {
            return res.status(400).json({ error: 'Invalid product ID' });
        }

        const storedProcedureName = "usp_del_product";
        const parameters = [
            { ParamName: "id", Value: productId, Direction: 0, DataType: "int" }
        ];

        await dbService.common_db_call(storedProcedureName, parameters, (err, result) => {
            if (err) {
                console.log("data service error: " + err);
                return res.status(500).send("data service error: " + err.message);
            }
            return res.status(200).json({ message: "Deleted successfully!" })
        });

    } catch (error) {
        res.status(400).json({ error });
    }
});

module.exports = router;
