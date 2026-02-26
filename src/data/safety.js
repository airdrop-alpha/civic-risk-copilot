function getSafetyIncidents() {
  const now = Date.now();

  return {
    city: 'Montgomery, AL',
    generatedAt: new Date(now).toISOString(),
    incidents: [
      {
        id: 'inc-001',
        type: 'Road Closure',
        location: 'N Perry St & Madison Ave',
        severity: 'medium',
        time: new Date(now - 1000 * 60 * 35).toISOString(),
        description: 'Lane restrictions due to utility repair work.',
      },
      {
        id: 'inc-002',
        type: 'Power Outage',
        location: 'Cloverdale District',
        severity: 'high',
        time: new Date(now - 1000 * 60 * 70).toISOString(),
        description: 'Localized outage reported, crews dispatched.',
      },
      {
        id: 'inc-003',
        type: 'Flooding Risk',
        location: 'Lower Commerce St',
        severity: 'medium',
        time: new Date(now - 1000 * 60 * 15).toISOString(),
        description: 'Standing water reported after heavy rain.',
      },
    ],
  };
}

module.exports = {
  getSafetyIncidents,
};
