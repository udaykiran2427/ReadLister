// Store our books in a lists
let bookShelf = {
  reading: [],
  wantToRead: [],
  read: [],
};

// Load books from localStorage when the page loads
function loadBooks() {
  const savedBooks = localStorage.getItem("myBooks");
  if (savedBooks) {
    bookShelf = JSON.parse(savedBooks);
    displayBooks();
  }
}

// Save books to localStorage
function saveBooks() {
  localStorage.setItem("myBooks", JSON.stringify(bookShelf));
}

// Search Google Books API
async function searchBooks(query) {
  try {
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
        query
      )}`
    );
    const data = await response.json();

    if (data.items && data.items.length > 0) {
      displaySearchResults(data.items);
    }
  } catch (error) {
    console.error("Error searching books:", error);
  }
}

// Display search results
function displaySearchResults(books) {
  const searchResults = document.getElementById("searchResults");
  searchResults.innerHTML = ""; // Clear previous results

  books.forEach((book) => {
    const bookInfo = book.volumeInfo;
    const title = bookInfo.title;
    const authors = bookInfo.authors
      ? bookInfo.authors.join(", ")
      : "Unknown Author";
    const coverUrl = bookInfo.imageLinks
      ? bookInfo.imageLinks.thumbnail
      : "placeholder.jpg";
    const description = bookInfo.description || "No description available";

    const bookCard = document.createElement("div");
    bookCard.className = "search-result-card";
    bookCard.innerHTML = `
            <img src="${coverUrl}" alt="${title} cover">
            <div class="book-info">
                <h3>${title}</h3>
                <p>By ${authors}</p>
                <p class="description">${description.substring(0, 150)}...</p>
                <select class="shelf-select">
                    <option value="">Add to shelf...</option>
                    <option value="reading">Currently Reading</option>
                    <option value="wantToRead">Want to Read</option>
                    <option value="read">Already Read</option>
                </select>
            </div>
        `;

    const shelfSelect = bookCard.querySelector(".shelf-select");
    shelfSelect.addEventListener("change", (e) => {
      if (e.target.value) {
        addBook(
          {
            title,
            author: authors,
            coverUrl,
            description,
            googleId: book.id,
          },
          e.target.value
        );
        searchResults.innerHTML = "";
      }
    });

    searchResults.appendChild(bookCard);
  });
}

// Add a new book
function addBook(bookData, status) {
  const book = {
    id: Date.now(),
    googleId: bookData.googleId,
    title: bookData.title,
    author: bookData.author,
    coverUrl: bookData.coverUrl,
    description: bookData.description,
  };

  bookShelf[status].push(book);
  saveBooks();
  displayBooks();
}

// Display books in their respective sections
function displayBooks() {
  Object.keys(bookShelf).forEach((status) => {
    const container = document.getElementById(status);
    container.innerHTML = "";

    bookShelf[status].forEach((book) => {
      const bookElement = createBookElement(book, status);
      container.appendChild(bookElement);
    });
  });
}

// Create HTML element for a book
function createBookElement(book, status) {
  const div = document.createElement("div");
  div.className = "book-card";
  div.innerHTML = `
        <img src="${book.coverUrl || "placeholder.jpg"}" alt="${
    book.title
  } cover">
        <h3>${book.title}</h3>
        <p>${book.author}</p>
        <select class="book-status" data-book-id="${book.id}">
            <option value="reading" ${
              status === "reading" ? "selected" : ""
            }>Currently Reading</option>
            <option value="wantToRead" ${
              status === "wantToRead" ? "selected" : ""
            }>Want to Read</option>
            <option value="read" ${
              status === "read" ? "selected" : ""
            }>Already Read</option>
        </select>
    `;

  div.querySelector(".book-status").addEventListener("change", (e) => {
    moveBook(book.id, status, e.target.value);
  });

  return div;
}

// Move a book between shelves
function moveBook(bookId, fromStatus, toStatus) {
  const bookIndex = bookShelf[fromStatus].findIndex(
    (book) => book.id === bookId
  );
  if (bookIndex !== -1) {
    const book = bookShelf[fromStatus].splice(bookIndex, 1)[0];
    bookShelf[toStatus].push(book);
    saveBooks();
    displayBooks();
  }
}

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  loadBooks();

  // Set up search functionality
  const searchInput = document.getElementById("searchInput");
  let searchTimeout;

  searchInput.addEventListener("input", (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      const query = e.target.value.trim();
      if (query.length >= 3) {
        searchBooks(query);
      } else {
        document.getElementById("searchResults").innerHTML = "";
      }
    }, 300);
  });

  //Trigger search on clicking addBookBtn
  const addBookBtn = document.getElementById("addBookBtn");
  if (addBookBtn) {
    addBookBtn.addEventListener("click", () => {
      searchInput.style.display = "block";
      searchInput.focus();
    });
  }

  // Close search results if clicked outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-container")) {
      document.getElementById("searchResults").innerHTML = "";
    }
  });

  // Handle form submission for new books
  document.getElementById("addBookForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("bookTitle").value;
    const author = document.getElementById("bookAuthor").value;
    const coverUrl = document.getElementById("bookCover").value;
    const status = document.getElementById("bookStatus").value;

    addBook(
      {
        title,
        author,
        coverUrl,
      },
      status
    );

    e.target.reset();
    document.getElementById("addBookModal").style.display = "none";
  });
});
