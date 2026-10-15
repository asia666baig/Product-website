"use strict";

const API_URL = "https://fakestoreapi.com/products";
const PAGE_SIZE = 8;

const productList = document.getElementById("productList");
const message = document.getElementById("message");
const retryButton = document.getElementById("retryButton");
const loadMoreButton = document.getElementById("loadMoreButton");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const sortSelect = document.getElementById("sortSelect");
const clearFiltersButton = document.getElementById("clearFilters");
const totalProducts = document.getElementById("totalProducts");
const totalCategories = document.getElementById("totalCategories");
const averagePrice = document.getElementById("averagePrice");
const resultCount = document.getElementById("resultCount");
const featuredImage = document.getElementById("featured-image");
const featuredImageWrap = document.getElementById("featured-image-wrap");
const featuredCategory = document.getElementById("featured-category");
const featuredName = document.getElementById("featured-name");
const featuredPrice = document.getElementById("featured-price");

let products = [];
let visibleCount = PAGE_SIZE;
let isLoading = false;

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

function setLoading(loading) {
  isLoading = loading;
  retryButton.hidden = true;
  loadMoreButton.hidden = true;
  message.classList.remove("error");
  message.replaceChildren();

  if (loading) {
    const spinner = document.createElement("span");
    spinner.className = "loading-spinner";
    spinner.setAttribute("aria-hidden", "true");
    message.append(spinner, document.createTextNode(" Finding lovely things..."));
  }
}

function getDailyProduct() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000);
  return products[dayOfYear % products.length];
}

function renderFeaturedProduct(product) {
  featuredCategory.textContent = product.category;
  featuredName.textContent = product.title;
  featuredPrice.textContent = inrFormatter.format(Number(product.price));
  featuredImage.alt = product.title;
  featuredImageWrap.classList.remove("image-fallback");
  featuredImage.src = product.image;
}

function renderSummary() {
  const categories = new Set(products.map((product) => product.category));
  const mean =
    products.reduce((sum, product) => sum + Number(product.price), 0) /
    products.length;

  totalProducts.textContent = String(products.length);
  totalCategories.textContent = String(categories.size);
  averagePrice.textContent = inrFormatter.format(mean);
  resultCount.textContent = String(products.length);
}

function renderCategoryOptions() {
  const selectedCategory = categoryFilter.value || "all";
  const categories = [...new Set(products.map((product) => product.category))].sort(
    (first, second) => first.localeCompare(second),
  );

  categoryFilter.replaceChildren();
  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "All categories";
  categoryFilter.append(allOption);

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.append(option);
  });

  categoryFilter.value = categories.includes(selectedCategory)
    ? selectedCategory
    : "all";
}

function getFilteredProducts() {
  const searchTerm = searchInput.value.trim().toLocaleLowerCase();
  const selectedCategory = categoryFilter.value;
  const filtered = products.filter((product) => {
    const matchesSearch =
      product.title.toLocaleLowerCase().includes(searchTerm) ||
      product.category.toLocaleLowerCase().includes(searchTerm);
    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  switch (sortSelect.value) {
    case "price-ascending":
      filtered.sort((first, second) => Number(first.price) - Number(second.price));
      break;
    case "price-descending":
      filtered.sort((first, second) => Number(second.price) - Number(first.price));
      break;
    case "rating":
      filtered.sort(
        (first, second) =>
          Number(second.rating?.rate ?? 0) - Number(first.rating?.rate ?? 0),
      );
      break;
    case "name":
      filtered.sort((first, second) => first.title.localeCompare(second.title));
      break;
    default: {
      const featuredId = products.length ? getDailyProduct().id : null;
      filtered.sort((first, second) => {
        if (first.id === second.id) return 0;
        if (first.id === featuredId) return -1;
        if (second.id === featuredId) return 1;
        return Number(first.id) - Number(second.id);
      });
    }
  }

  return filtered;
}

function createProductCard(product, index) {
  const card = document.createElement("article");
  card.className = "product-card";
  card.style.animationDelay = `${Math.min(index * 35, 245)}ms`;

  const imageWrap = document.createElement("div");
  imageWrap.className = "product-image-wrap";

  const image = document.createElement("img");
  image.className = "product-image";
  image.src = product.image;
  image.alt = product.title;
  image.loading = "lazy";
  image.decoding = "async";
  image.addEventListener("error", () => {
    image.removeAttribute("src");
    image.alt = `${product.title} image unavailable`;
    imageWrap.classList.add("image-fallback");
  });

  const category = document.createElement("span");
  category.className = "product-category";
  category.textContent = product.category;

  const info = document.createElement("div");
  info.className = "product-info";

  const rating = document.createElement("div");
  rating.className = "product-rating";
  const stars = document.createElement("span");
  stars.className = "rating-stars";
  stars.setAttribute("aria-hidden", "true");
  const ratingValue = Number(product.rating?.rate);
  stars.textContent = Number.isFinite(ratingValue)
    ? `${"★".repeat(Math.max(0, Math.min(5, Math.round(ratingValue))))}${"☆".repeat(Math.max(0, 5 - Math.round(ratingValue)))}`
    : "☆☆☆☆☆";
  const ratingLabel = document.createElement("span");
  const ratingCount = Number(product.rating?.count);
  ratingLabel.textContent =
    Number.isFinite(ratingValue) && Number.isFinite(ratingCount)
      ? `${ratingValue.toFixed(1)} (${ratingCount})`
      : "Not rated yet";
  rating.append(stars, ratingLabel);

  const name = document.createElement("h3");
  name.className = "product-title";
  name.textContent = product.title;

  const bottom = document.createElement("div");
  bottom.className = "product-card-bottom";

  const price = document.createElement("span");
  price.className = "product-price";
  price.textContent = inrFormatter.format(Number(product.price));

  const priceCaption = document.createElement("span");
  priceCaption.className = "price-caption";
  priceCaption.textContent = "per item";

  imageWrap.append(image, category);
  bottom.append(price, priceCaption);
  info.append(rating, name, bottom);
  card.append(imageWrap, info);
  return card;
}

function renderProducts() {
  const filteredProducts = getFilteredProducts();
  const pageOfProducts = filteredProducts.slice(0, visibleCount);
  const fragment = document.createDocumentFragment();

  productList.replaceChildren();
  resultCount.textContent = String(filteredProducts.length);
  clearFiltersButton.hidden =
    searchInput.value.trim() === "" &&
    categoryFilter.value === "all" &&
    sortSelect.value === "featured";

  if (filteredProducts.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";
    emptyState.textContent =
      "Nothing matches those filters. Try a different search or clear your filters.";
    productList.append(emptyState);
    message.textContent = "No products found.";
    loadMoreButton.hidden = true;
    return;
  }

  pageOfProducts.forEach((product, index) => {
    fragment.append(createProductCard(product, index));
  });
  productList.append(fragment);

  const countMessage =
    pageOfProducts.length < filteredProducts.length
      ? `Showing ${pageOfProducts.length} of ${filteredProducts.length} products`
      : `Showing all ${filteredProducts.length} products`;
  message.textContent = countMessage;
  loadMoreButton.hidden = pageOfProducts.length >= filteredProducts.length;
}

function clearFilters() {
  searchInput.value = "";
  categoryFilter.value = "all";
  sortSelect.value = "featured";
  visibleCount = PAGE_SIZE;
  renderProducts();
  searchInput.focus();
}

async function fetchProducts() {
  if (isLoading) return;
  setLoading(true);

  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`The product service responded with status ${response.status}.`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error("The product service returned data in an unexpected format.");
    }

    products = data
      .filter(
        (product) =>
          Number.isFinite(Number(product.id)) &&
          typeof product.title === "string" &&
          typeof product.category === "string" &&
          typeof product.image === "string" &&
          Number.isFinite(Number(product.price)),
      )
      .sort((first, second) => Number(first.id) - Number(second.id));

    if (products.length === 0) {
      throw new Error("The product service did not return any valid products.");
    }

    visibleCount = PAGE_SIZE;
    renderSummary();
    renderCategoryOptions();
    renderFeaturedProduct(getDailyProduct());
    message.classList.remove("error");
    renderProducts();
  } catch (error) {
    console.error("Unable to fetch products:", error);
    products = [];
    totalProducts.textContent = "0";
    totalCategories.textContent = "0";
    averagePrice.textContent = inrFormatter.format(0);
    resultCount.textContent = "0";
    productList.replaceChildren();
    categoryFilter.replaceChildren();
    message.classList.add("error");
    message.textContent =
      error instanceof Error
        ? `Unable to load products: ${error.message} Check your connection and try again.`
        : "Unable to load products. Check your connection and try again.";
    retryButton.hidden = false;
  } finally {
    isLoading = false;
  }
}

featuredImage.addEventListener("error", () => {
  featuredImage.removeAttribute("src");
  featuredImageWrap.classList.add("image-fallback");
});
retryButton.addEventListener("click", fetchProducts);
loadMoreButton.addEventListener("click", () => {
  visibleCount += PAGE_SIZE;
  renderProducts();
});
searchInput.addEventListener("input", () => {
  visibleCount = PAGE_SIZE;
  renderProducts();
});
categoryFilter.addEventListener("change", () => {
  visibleCount = PAGE_SIZE;
  renderProducts();
});
sortSelect.addEventListener("change", () => {
  visibleCount = PAGE_SIZE;
  renderProducts();
});
clearFiltersButton.addEventListener("click", clearFilters);
document.addEventListener("keydown", (event) => {
  if (
    event.key === "/" &&
    !["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement?.tagName)
  ) {
    event.preventDefault();
    searchInput.focus();
  }
  if (event.key === "Escape" && document.activeElement === searchInput) {
    searchInput.value = "";
    visibleCount = PAGE_SIZE;
    renderProducts();
  }
});

fetchProducts();
