import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const RoleBasedRedirect = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem('role');
  const token = localStorage.getItem('token');

  useEffect(() => {
    // Nếu có token và role là admin
    if (token && role === 'admin') {
      // Nếu đang ở trang user (không phải /admin), redirect đến admin
      if (!location.pathname.startsWith('/admin')) {
        navigate('/admin', { replace: true });
      }
    } else if (token && role === 'user') {
      // Nếu là user nhưng đang cố truy cập /admin
      if (location.pathname.startsWith('/admin')) {
        navigate('/', { replace: true });
      }
    }
  }, [token, role, location.pathname, navigate]);

  return children;
};

export default RoleBasedRedirect;
