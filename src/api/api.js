import axios from "axios";

export const getImages = async (query, page = 1, per_page = 120) => {
  try {
    const API_KEY = '39585619-aa4b6e4892b9b84c497548f0d';
    const url = `https://pixabay.com/api/?key=${API_KEY}&q=${encodeURIComponent(query)}&image_type=photo&per_page=${per_page}&page=${page}&safesearch=true`;
    
    const response = await axios.get(url);
    return {
      images: response.data.hits || [],
      totalHits: response.data.totalHits || 0,
      totalPages: Math.ceil((response.data.totalHits || 0) / per_page)
    };
  } catch (error) {
    console.error('Error fetching images:', error);
    return { images: [], totalHits: 0, totalPages: 0 };
  }
};