/**
 * Validation utilities for Launchpad API
 * Provides strict input sanitization, type checks, and protocol safety.
 */

// Email regex adhering to RFC 5322 simplified standard
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const ALLOWED_MODES = ['Remote', 'Hybrid', 'On-site'];

/**
 * Validates whether a given string is a safe HTTP/HTTPS URL
 * Rejects javascript:, data:, file:, etc.
 */
function isValidSafeUrl(urlString) {
  if (typeof urlString !== 'string') return false;
  const trimmed = urlString.trim();
  if (!trimmed) return false;

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

/**
 * Validates email format
 */
function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length < 5 || trimmed.length > 254) return false;
  return EMAIL_REGEX.test(trimmed);
}

/**
 * Parses and sanitizes pagination parameters
 */
function parsePagination(query) {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);

  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = 10;
  if (limit > 50) limit = 50; // Cap at 50 to prevent DoS

  return { page, limit, offset: (page - 1) * limit };
}

/**
 * Validates payload for creating or updating an internship
 */
function validateInternshipPayload(body, isUpdate = false) {
  const errors = [];
  const cleanData = {};

  // Title
  if (!isUpdate || body.title !== undefined) {
    if (!body.title || typeof body.title !== 'string' || body.title.trim().length < 3) {
      errors.push('Title is required and must be at least 3 characters long.');
    } else if (body.title.trim().length > 100) {
      errors.push('Title must not exceed 100 characters.');
    } else {
      cleanData.title = body.title.trim();
    }
  }

  // Domain
  if (!isUpdate || body.domain !== undefined) {
    if (!body.domain || typeof body.domain !== 'string' || body.domain.trim().length < 2) {
      errors.push('Domain is required and must be at least 2 characters long.');
    } else if (body.domain.trim().length > 60) {
      errors.push('Domain must not exceed 60 characters.');
    } else {
      cleanData.domain = body.domain.trim();
    }
  }

  // Mode
  if (!isUpdate || body.mode !== undefined) {
    if (!body.mode || typeof body.mode !== 'string' || !ALLOWED_MODES.includes(body.mode.trim())) {
      errors.push(`Mode must be one of: ${ALLOWED_MODES.join(', ')}.`);
    } else {
      cleanData.mode = body.mode.trim();
    }
  }

  // Location
  if (body.location !== undefined) {
    if (typeof body.location !== 'string' || body.location.trim().length === 0) {
      errors.push('Location must be a non-empty string.');
    } else if (body.location.trim().length > 100) {
      errors.push('Location must not exceed 100 characters.');
    } else {
      cleanData.location = body.location.trim();
    }
  } else if (!isUpdate) {
    cleanData.location = 'India';
  }

  // Duration Weeks
  if (!isUpdate || body.duration_weeks !== undefined) {
    const weeks = parseInt(body.duration_weeks, 10);
    if (isNaN(weeks) || weeks < 1 || weeks > 52) {
      errors.push('Duration in weeks must be an integer between 1 and 52.');
    } else {
      cleanData.duration_weeks = weeks;
    }
  }

  // Openings
  if (body.openings !== undefined) {
    const openings = parseInt(body.openings, 10);
    if (isNaN(openings) || openings < 0 || openings > 1000) {
      errors.push('Openings must be an integer between 0 and 1000.');
    } else {
      cleanData.openings = openings;
    }
  } else if (!isUpdate) {
    cleanData.openings = 1;
  }

  // Applications Open
  if (body.applications_open !== undefined) {
    const val = Number(body.applications_open);
    if (val !== 0 && val !== 1) {
      errors.push('applications_open must be 1 (open) or 0 (closed).');
    } else {
      cleanData.applications_open = val;
    }
  } else if (!isUpdate) {
    cleanData.applications_open = 1;
  }

  // Skills
  if (body.skills !== undefined) {
    let skillsArr = body.skills;
    if (typeof skillsArr === 'string') {
      try {
        skillsArr = JSON.parse(skillsArr);
      } catch (e) {
        skillsArr = skillsArr.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    if (!Array.isArray(skillsArr)) {
      errors.push('Skills must be an array of strings.');
    } else {
      const sanitizedSkills = skillsArr
        .filter(s => typeof s === 'string' && s.trim().length > 0)
        .map(s => s.trim().slice(0, 40));
      cleanData.skills = JSON.stringify(sanitizedSkills);
    }
  } else if (!isUpdate) {
    cleanData.skills = '[]';
  }

  // Description
  if (body.description !== undefined) {
    if (typeof body.description !== 'string') {
      errors.push('Description must be a string.');
    } else {
      cleanData.description = body.description.trim().slice(0, 2000);
    }
  } else if (!isUpdate) {
    cleanData.description = '';
  }

  // Optional custom ID on create
  if (!isUpdate && body.id !== undefined) {
    if (typeof body.id !== 'string' || !/^[A-Za-z0-9_-]{3,20}$/.test(body.id.trim())) {
      errors.push('Custom ID must be alphanumeric and between 3 and 20 characters (hyphens/underscores allowed).');
    } else {
      cleanData.id = body.id.trim();
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: cleanData
  };
}

/**
 * Validates payload for submitting an application
 */
function validateApplicationPayload(body) {
  const errors = [];
  const cleanData = {};

  // internship_id
  if (!body.internship_id || typeof body.internship_id !== 'string' || !body.internship_id.trim()) {
    errors.push('internship_id is required.');
  } else {
    cleanData.internship_id = body.internship_id.trim();
  }

  // applicant_name
  if (!body.applicant_name || typeof body.applicant_name !== 'string' || body.applicant_name.trim().length < 2) {
    errors.push('applicant_name is required and must be at least 2 characters.');
  } else if (body.applicant_name.trim().length > 100) {
    errors.push('applicant_name must not exceed 100 characters.');
  } else {
    cleanData.applicant_name = body.applicant_name.trim();
  }

  // applicant_email
  if (!body.applicant_email || !isValidEmail(body.applicant_email)) {
    errors.push('A valid applicant_email address is required.');
  } else {
    cleanData.applicant_email = body.applicant_email.trim().toLowerCase();
  }

  // portfolio_url (optional, but must be safe if provided)
  if (body.portfolio_url !== undefined && body.portfolio_url !== null && String(body.portfolio_url).trim() !== '') {
    const rawUrl = String(body.portfolio_url).trim();
    if (!isValidSafeUrl(rawUrl)) {
      errors.push('portfolio_url must be a valid HTTP or HTTPS web address.');
    } else {
      cleanData.portfolio_url = rawUrl;
    }
  } else {
    cleanData.portfolio_url = null;
  }

  // notes (optional)
  if (body.notes !== undefined && body.notes !== null) {
    cleanData.notes = String(body.notes).trim().slice(0, 1000);
  } else {
    cleanData.notes = null;
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: cleanData
  };
}

module.exports = {
  isValidSafeUrl,
  isValidEmail,
  parsePagination,
  validateInternshipPayload,
  validateApplicationPayload,
  ALLOWED_MODES
};
