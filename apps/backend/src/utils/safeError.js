const isProduction = () => process.env.NODE_ENV === 'production';

const safeErrorDetails = (error) => {
  if (isProduction()) {
    return undefined;
  }

  return String(error?.message || error || '').slice(0, 500);
};

const withOptionalDetails = (payload, error) => {
  const details = safeErrorDetails(error);
  return details ? { ...payload, details } : payload;
};

module.exports = {
  safeErrorDetails,
  withOptionalDetails,
};
