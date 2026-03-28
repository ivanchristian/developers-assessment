const API_URL = import.meta.env.FRONTEND_HOST ?? 'http://localhost:5173';

const getCacheBustingUrl = (path: string): string => {
  return `${API_URL}${path}?t=${Date.now()}`;
};

export const fetchWorklogs = async (): Promise<any> => {
  try {
    const response = await fetch(getCacheBustingUrl('/mock/worklogs.json'));
    if (!response.ok) {
      throw new Error('Failed to fetch worklogs');
    }
    const data = await response.json();
    return data as any;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const fetchTimeEntries = async (): Promise<any> => {
  try {
    const response = await fetch(getCacheBustingUrl('/mock/timeEntries.json'));
    if (!response.ok) {
      throw new Error('Failed to fetch time entries');
    }
    const data = await response.json();
    return data as any;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const fetchFreelancers = async (): Promise<any> => {
  try {
    const response = await fetch(getCacheBustingUrl('/mock/freelancers.json'));
    if (!response.ok) {
      throw new Error('Failed to fetch freelancers');
    }
    const data = await response.json();
    return data as any;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
