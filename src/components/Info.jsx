import React, { useState, useEffect, useCallback } from "react";
import { Sun, Moon, Search, Download, ArrowDown, Loader } from "lucide-react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";
import Masonry from "react-masonry-css";
import { getImages } from "../api/api";
import '../styles/index.css';

const Info = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [search, setSearch] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [currentQuery, setCurrentQuery] = useState("");
  const [imageIds, setImageIds] = useState(new Set());
  const [showSuggestions, setShowSuggestions] = useState(true);

  const suggestions = ["Nature", "Technology", "Cities", "Architecture", "Travel", "Minimalism"];

  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDark);
    if (prefersDark) document.documentElement.classList.add('dark');

    handleFeaturedSearch();
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
    document.documentElement.classList.toggle("dark");
  };

  const fetchImages = useCallback(async (searchQuery, page, isLoadMore = false) => {
    try {
      const { images: newImages, totalPages: pages } = await getImages(searchQuery, page);

      // Filter out duplicate images
      const filteredImages = newImages.filter(img => !imageIds.has(img.id));

      if (filteredImages.length > 0) {
        const newImageIds = new Set(imageIds);
        filteredImages.forEach(img => newImageIds.add(img.id));
        setImageIds(newImageIds);

        // Preload images
        const imagePromises = filteredImages.map(img => {
          return new Promise((resolve) => {
            const imgElement = new Image();
            imgElement.src = img.webformatURL;
            imgElement.onload = () => resolve(img);
          });
        });

        const loadedImages = await Promise.all(imagePromises);

        if (isLoadMore) {
          setImages(prev => [...prev, ...loadedImages]);
        } else {
          setImages(loadedImages);
        }
      }

      setTotalPages(pages);
      setCurrentQuery(searchQuery);

      return filteredImages.length; // Return number of images loaded
    } catch (error) {
      console.error("Ooops, Error fetching images :", error);
      return 0;
    }
  }, [imageIds]);

  const handleSearch = async () => {
    if (!search.trim()) return;

    setLoading(true);
    setShowSuggestions(false);
    setImages([]);
    setImageIds(new Set()); // Reset image tracking
    setCurrentPage(1);

    try {
      await fetchImages(search, 1);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (loadingMore || currentPage >= totalPages) return;

    setLoadingMore(true);
    const nextPage = currentPage + 1;

    try {
      const count = await fetchImages(currentQuery, nextPage, true);
      if (count > 0) {
        setCurrentPage(nextPage); // Update page only if images were fetched
      }
    } catch (error) {
      console.error("Error loading more images:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleFeaturedSearch = async () => {
    setLoading(true);
    setCurrentPage(1);
    setImageIds(new Set()); // Reset duplicates tracking
    const featuredQuery = "minimal aesthetic";
    setCurrentQuery(featuredQuery);

    try {
      await fetchImages(featuredQuery, 1);
    } catch (error) {
      console.error("Error loading featured images:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleSuggestionClick = (suggestion) => {
    setSearch(suggestion);
    setTimeout(handleSearch, 100);
  };

  const handleDownload = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename || "image.jpg";
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
        document.body.removeChild(link);
      }, 100);
    } catch (error) {
      console.error("Error downloading image:", error);
      alert("Failed to download image. Please try again.");
    }
  };

  const breakpointColumns = {
    default: 4,
    1280: 3,
    1024: 3,
    768: 2,
    640: 1
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-content">
          <div className="logo-container">
            <div className="loader"></div>
            <h1 className="logo">ImageFinder</h1>
          </div>

          <div className="search-container">
            <div className="search-wrapper">
              <Search className="search-icon" size={18} />
              <input
                type="text"
                placeholder="Search high-resolution images"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                className="search-input"
              />
              <button
                className="search-button"
                onClick={handleSearch}
              >
                Search
              </button>
            </div>
          </div>

          <button onClick={toggleDarkMode} className="theme-toggle">
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {showSuggestions && (
          <div className="suggestions-container">
            <div className="suggestions-wrapper">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="suggestion-chip"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="main-content">
        {loading ? (
          <div className="loading-container">
            <Loader className="spinner" size={32} />
            <p className="loading-text">Brushing pixels onto the canvas... Just a moment!</p>
          </div>
        ) : images.length === 0 ? (
          <div className="no-results">
            <h2>Oops! The search stars didn’t align.</h2>
            <p>Try a different keyword and let's discover something magical!</p>
          </div>
        ) : (
          <>
            <Masonry
              breakpointCols={breakpointColumns}
              className="masonry-grid"
              columnClassName="masonry-grid-column"
            >
              {images.map((image) => (
                <div key={image.id} className="image-card">
                  <div className="image-container">
                    <LazyLoadImage
                      src={image.webformatURL}
                      alt={image.tags}
                      effect="blur"
                      placeholderSrc={image.previewURL}
                      className="image"
                    />
                    <div className="image-overlay"></div>
                    <button
                      className="download-button"
                      onClick={() => handleDownload(image.largeImageURL, `image-${image.id}.jpg`)}
                    >
                      <Download size={16} /> Download
                    </button>
                  </div>
                </div>
              ))}
            </Masonry>

            {currentPage < totalPages && (
              <div className="load-more-container">
                <button
                  className="load-more-button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <>
                      <Loader className="spinner" size={16} />
                      Loading...
                    </>
                  ) : (
                    <>
                      <ArrowDown size={32} />
                      Load more images
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Info;
