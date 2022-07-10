const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const app = express();
app.use(express.json());

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("The server is starting");
    });
  } catch (e) {
    console.log(`Db Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const statusQuery = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const priorityQuery = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const priorityAndStatusQuery = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.priority !== undefined
  );
};

const searchQuery = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

const categoryAndStatusQuery = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.category !== undefined
  );
};
const categoryQuery = (requestQuery) => {
  return requestQuery.category !== undefined;
};
const categoryAndPriorityQuery = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const convertTodoTable = (obj) => {
  return {
    id: obj.id,
    todo: obj.todo,
    priority: obj.priority,
    status: obj.status,
    category: obj.category,
    dueDate: obj.due_date,
  };
};

// const checkInvalidValues = (request, response, next) => {
//   const requestQuery = request.query;
//   const {
//     priority = "HIGH",
//     status = "TODO",
//     category = "WORK",
//   } = requestQuery;

//   const isPriorityValid = validPriority.includes(priority);
//   if (isPriorityValid === false) {
//     response.status(400);
//     response.send("Invalid Todo Priority");
//   }

//   const isStatusValid = validStatus.includes(status);
//   if (isStatusValid === false) {
//     response.status(400);
//     response.send("Invalid Todo Status");
//   }

//   const isCategoryValid = validCategory.includes(category);
//   if (isCategoryValid === false) {
//     response.status(400);
//     response.send("Invalid Todo Category");
//   }

//   next();
// };
let checkPriority = (priority) => {
  const validPriority = ["HIGH", "MEDIUM", "LOW"];
  const isPriorityValid = validPriority.includes(priority);
  return isPriorityValid;
};

let checkStatus = (status) => {
  const validStatus = ["TO DO", "IN PROGRESS", "DONE"];
  const isStatusValid = validStatus.includes(status);
  return isStatusValid;
};

let checkCategory = (category) => {
  const validCategory = ["WORK", "HOME", "LEARNING"];
  const isCategoryValid = validCategory.includes(category);
  return isCategoryValid;
};

app.get("/todos/", async (request, response) => {
  const requestQuery = request.query;
  let getDetailsQuery = null;

  switch (true) {
    case statusQuery(requestQuery):
      if (checkStatus(requestQuery.status) === false) {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      getDetailsQuery = `
          SELECT 
           *
          FROM 
           todo
          WHERE 
           status ='${requestQuery.status}';`;
      break;
    case priorityQuery(requestQuery):
      if (checkPriority(requestQuery.priority) === false) {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      getDetailsQuery = `
        SELECT 
         * 
        FROM 
         todo 
        WHERE priority = '${requestQuery.priority}';`;
      break;
    case priorityAndStatusQuery(requestQuery):
      if (checkStatus(requestQuery.status) === false) {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      if (checkPriority(requestQuery.priority) === false) {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      getDetailsQuery = `
        SELECT 
         * 
        FROM 
         todo 
        WHERE priority = '${requestQuery.priority}'
         AND status = '${requestQuery.status}';`;
      break;
    case searchQuery(requestQuery):
      getDetailsQuery = `
        SELECT 
         * 
        FROM 
         todo 
        WHERE todo LIKE "%${requestQuery.search_q}%"`;
      break;
    case categoryAndStatusQuery(requestQuery):
      if (checkStatus(requestQuery.status) === false) {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      if (checkCategory(requestQuery.category) === false) {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      getDetailsQuery = `
        SELECT 
         * 
        FROM 
         todo 
        WHERE category = '${requestQuery.category}'
        AND status = '${requestQuery.status}'`;
      break;
    case categoryQuery(requestQuery):
      if (checkCategory(requestQuery.category) === false) {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      getDetailsQuery = `
        SELECT 
         * 
        FROM 
         todo 
        WHERE category = '${requestQuery.category}';`;
      break;
    case categoryAndPriorityQuery(requestQuery):
      if (checkCategory(requestQuery.category) === false) {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      if (checkPriority(requestQuery.priority) === false) {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      getDetailsQuery = `
        SELECT 
         * 
        FROM 
         todo 
        WHERE category = '${requestQuery.category}'
        AND priority = '${requestQuery.priority}';`;
      break;
    default:
      getDetailsQuery = `
        SELECT 
         * 
        FROM 
         todo;`;
  }
  const todoArray = await db.all(getDetailsQuery);
  response.send(todoArray.map((eachTodo) => convertTodoTable(eachTodo)));
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getSingleTodoQuery = `
    SELECT 
     * 
    FROM 
     todo 
    WHERE 
     id = ${todoId};`;
  const todoInfo = await db.get(getSingleTodoQuery);
  response.send(convertTodoTable(todoInfo));
});

app.get("/agenda/", async (request, response) => {
  let date = request.query.date;
  const dateValidity = isValid(new Date(date));
  if (dateValidity === false) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    let dateFormat = format(new Date(date), "yyyy-MM-dd");
    const getDateQuery = `
      SELECT
       *
      FROM
       todo
      WHERE
       due_date LIKE "%${dateFormat}%" ;`;
    const todoArray = await db.all(getDateQuery);
    response.send(todoArray);
    // console.log(dateFormat);
  }
});

const isCheckPriority = (priority) => {
  const validPriority = ["HIGH", "MEDIUM", "LOW"];
  const isPriorityValid = validPriority.includes(priority);
  return isPriorityValid;
};

const isCheckStatus = (status) => {
  const validStatus = ["TO DO", "IN PROGRESS", "DONE"];
  const isStatusValid = validStatus.includes(status);
  return isStatusValid;
};

const isCheckCategory = (category) => {
  const validCategory = ["WORK", "HOME", "LEARNING"];
  const isCategoryValid = validCategory.includes(category);
  return isCategoryValid;
};

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (isCheckStatus(status) === false) {
    response.status(400);
    response.send("Invalid Todo Status");
  }
  if (isCheckCategory(category) === false) {
    response.status(400);
    response.send("Invalid Todo Category");
  }
  if (isCheckPriority(priority) === false) {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
  if (isValid(new Date(dueDate)) === false) {
    response.status(400);
    response.send("Invalid Due Date");
  }
  const createTodoQuery = `
    INSERT INTO todo(id,todo,priority,status,category, due_date)
    VALUES( ${id},
        '${todo}',
        '${priority}',
        '${status}',
        '${category}',
        '${dueDate}');`;
  await db.run(createTodoQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  let updatedKey = "";
  const requestBody = request.body;

  switch (true) {
    case requestBody.status !== undefined:
      updatedKey = "Status";
      break;
    case requestBody.priority !== undefined:
      updatedKey = "Priority";
      break;
    case requestBody.todo !== undefined:
      updatedKey = "Todo";
      break;
    case requestBody.category !== undefined:
      updatedKey = "Category";
      break;
    case request.dueDate !== undefined:
      updatedKey = "Due Date";
      break;
  }

  const previousTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    status = previousTodo.status,
    priority = previousTodo.priority,
    todo = previousTodo.todo,
    category = previousTodo.category,
    dueDate = previousTodo.due_date,
  } = request.body;

  const updateQuery = `
  UPDATE 
   todo 
  SET 
   todo = '${todo}',
   status = '${status}',
   category = '${category}',
   priority = '${priority}',
   due_date = '${dueDate}'
  WHERE 
   id = ${todoId};`;

  await db.run(updateQuery);
  response.send(`${updateKey} Updated`);
});

app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
  DELETE FROM todo 
  WHERE id = ${todoId};`;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
