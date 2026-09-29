
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};


firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const expensesRef = db.collection("expenses");


const form = document.getElementById("expenseForm");
const titleInput = document.getElementById("title");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const expenseList = document.getElementById("expenseList");
const totalExpenses = document.getElementById("totalExpenses");
const totalAmount = document.getElementById("totalAmount");
const addBtn = document.getElementById("addBtn");
const formMessage = document.getElementById("formMessage");


const today = new Date();
const localDate = [
  today.getFullYear(),
  String(today.getMonth() + 1).padStart(2, "0"),
  String(today.getDate()).padStart(2, "0")
].join("-");

dateInput.value = localDate;


form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const title = titleInput.value.trim();
  const amount = Number(amountInput.value);
  const category = categoryInput.value;
  const date = dateInput.value;

  if (!title || !category || !date ||
      !Number.isFinite(amount) || amount <= 0) {
    formMessage.textContent = "Please enter valid details.";
    formMessage.style.color = "red";
    return;
  }

  addBtn.disabled = true;
  addBtn.textContent = "Saving...";

  try {
    await expensesRef.add({
      title: title,
      amount: amount,
      category: category,
      date: date,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    form.reset();
    dateInput.value = localDate;

    formMessage.textContent = "Expense added successfully!";
    formMessage.style.color = "green";

  } catch (error) {
    console.error(error);
    formMessage.textContent = "Error saving expense!";
    formMessage.style.color = "red";

  } finally {
    addBtn.disabled = false;
    addBtn.textContent = "+ Add Expense";
  }
});


async function deleteExpense(id, button) {
  if (!confirm("Are you sure you want to delete this expense?")) {
    return;
  }

  button.disabled = true;
  button.textContent = "Deleting...";

  try {
    await expensesRef.doc(id).delete();
  } catch (error) {
    console.error(error);
    alert("Error deleting expense!");
    button.disabled = false;
    button.textContent = "Delete";
  }
}


expensesRef.orderBy("date", "desc").onSnapshot((snapshot) => {
  expenseList.replaceChildren();

  let count = 0;
  let total = 0;

  if (snapshot.empty) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = 5;
    cell.className = "empty";
    cell.textContent = "No expenses added yet.";

    row.appendChild(cell);
    expenseList.appendChild(row);
  }

  snapshot.forEach((doc) => {
    const expense = doc.data();

    count++;
    total += Number(expense.amount) || 0;

    const row = document.createElement("tr");

    const titleCell = document.createElement("td");
    titleCell.textContent = expense.title || "";

    const categoryCell = document.createElement("td");
    const categoryBadge = document.createElement("span");
    categoryBadge.className = "category";
    categoryBadge.textContent = expense.category || "Other";
    categoryCell.appendChild(categoryBadge);

    const dateCell = document.createElement("td");
    dateCell.textContent = expense.date || "";

    const amountCell = document.createElement("td");
    amountCell.textContent =
      "Rs. " + Number(expense.amount || 0).toLocaleString("en-PK");

    const actionCell = document.createElement("td");
    const deleteBtn = document.createElement("button");

    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "Delete";

    deleteBtn.addEventListener("click", () => {
      deleteExpense(doc.id, deleteBtn);
    });

    actionCell.appendChild(deleteBtn);

    row.append(
      titleCell,
      categoryCell,
      dateCell,
      amountCell,
      actionCell
    );

    expenseList.appendChild(row);
  });

  // 8. Calculate Total Expenses
  totalExpenses.textContent = count;

  // 9. Calculate Total Amount
  totalAmount.textContent =
    "Rs. " + total.toLocaleString("en-PK", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });

}, (error) => {
  console.error("Firestore error:", error);

  expenseList.replaceChildren();

  const row = document.createElement("tr");
  const cell = document.createElement("td");

  cell.colSpan = 5;
  cell.className = "empty";
  cell.textContent = "Unable to load expenses. Check Firebase setup.";

  row.appendChild(cell);
  expenseList.appendChild(row);
});