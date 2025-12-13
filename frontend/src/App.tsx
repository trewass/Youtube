import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import OnlineStatus from './components/OnlineStatus'
import HomePage from './pages/HomePage'
import ChannelsPage from './pages/ChannelsPage'
import PlaylistsPage from './pages/PlaylistsPage'
import AudiobooksPage from './pages/AudiobooksPage'
import AudiobookDetailPage from './pages/AudiobookDetailPage'

function App() {
  return (
    <Router>
      <OnlineStatus />
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/channels" element={<ChannelsPage />} />
          <Route path="/playlists/:channelId" element={<PlaylistsPage />} />
          <Route path="/audiobooks/:playlistId" element={<AudiobooksPage />} />
          <Route path="/audiobook/:audiobookId" element={<AudiobookDetailPage />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App


