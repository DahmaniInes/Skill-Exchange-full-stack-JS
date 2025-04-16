
export const formatDate = (date) => {
    if (!date) return "";
    if (typeof date === 'string') return date.split('T')[0];
    return new Date(date).toISOString().split('T')[0];
  };