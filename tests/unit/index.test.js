import { jest } from '@jest/globals';

describe('index.js Component Tests', () => {
  let index;

  beforeAll(async () => {
    index = await import('../../scraper/index.js');
  });

  const sampleBambooData = {
    meta: { totalCount: 2 },
    result: [
      {
        id: "72",
        jobOpeningName: "Full Stack Developer",
        departmentId: "18435",
        departmentLabel: "Development",
        employmentStatusLabel: "CIM",
        location: { city: "Cluj-Napoca", state: "Romania" },
        locationType: "2"
      },
      {
        id: "73",
        jobOpeningName: "DevOps Engineer",
        departmentId: "18435",
        departmentLabel: "Development",
        employmentStatusLabel: "CIM",
        location: { city: "Cluj-Napoca", state: "Romania" },
        locationType: "3"
      }
    ]
  };

  describe('transformJobsForSOLR', () => {
    it('should filter locations to only Romanian cities', () => {
      const payload = {
        jobs: [
          { url: 'https://test.com/1', title: 'Job 1', location: ['România'] },
          { url: 'https://test.com/2', title: 'Job 2', location: ['Bucharest'] },
          { url: 'https://test.com/3', title: 'Job 3', location: ['Bulgaria'] },
          { url: 'https://test.com/4', title: 'Job 4', location: ['Cluj-Napoca'] },
          { url: 'https://test.com/5', title: 'Job 5', location: [] }
        ]
      };

      const result = index.transformJobsForSOLR(payload);

      expect(result.jobs[0].location).toEqual(['România']);
      expect(result.jobs[1].location).toEqual(['Bucharest']);
      expect(result.jobs[2].location).toEqual(['România']);
      expect(result.jobs[3].location).toEqual(['Cluj-Napoca']);
      expect(result.jobs[4].location).toEqual(['România']);
    });

    it('should keep company uppercase', () => {
      const payload = {
        source: 'wearetec.com',
        company: 'tec software solutions srl',
        cif: '32971419',
        jobs: [
          { url: 'https://test.com/1', title: 'Job 1', company: 'tec software solutions srl', cif: '32971419' }
        ]
      };

      const result = index.transformJobsForSOLR(payload);

      expect(result.company).toBe('TEC SOFTWARE SOLUTIONS SRL');
    });

    it('should normalize workmode values', () => {
      const payload = {
        jobs: [
          { url: 'https://test.com/1', title: 'Job 1', workmode: 'Remote' },
          { url: 'https://test.com/2', title: 'Job 2', workmode: 'ON-SITE' },
          { url: 'https://test.com/3', title: 'Job 3', workmode: 'Hybrid' },
          { url: 'https://test.com/4', title: 'Job 4', workmode: 'hybrid' }
        ]
      };

      const result = index.transformJobsForSOLR(payload);

      expect(result.jobs[0].workmode).toBe('remote');
      expect(result.jobs[1].workmode).toBe('on-site');
      expect(result.jobs[2].workmode).toBe('hybrid');
      expect(result.jobs[3].workmode).toBe('hybrid');
    });

    it('should handle empty jobs array', () => {
      const result = index.transformJobsForSOLR({ jobs: [] });
      expect(result.jobs).toEqual([]);
    });
  });

  describe('mapToJobModel', () => {
    it('should map raw job to job model format', () => {
      const rawJob = {
        url: 'https://tecss.bamboohr.com/careers/72',
        title: 'Full Stack Developer',
        location: ['Cluj-Napoca', 'Romania'],
        tags: ['Java', 'Spring'],
        workmode: 'hybrid'
      };

      const COMPANY_NAME = 'TEC SOFTWARE SOLUTIONS SRL';
      const COMPANY_CIF = '32971419';

      const result = index.mapToJobModel(rawJob, COMPANY_CIF, COMPANY_NAME);

      expect(result.url).toBe(rawJob.url);
      expect(result.title).toBe(rawJob.title);
      expect(result.company).toBe(COMPANY_NAME);
      expect(result.cif).toBe(COMPANY_CIF);
      expect(result.location).toEqual(rawJob.location);
      expect(result.tags).toEqual(rawJob.tags);
      expect(result.workmode).toBe(rawJob.workmode);
      expect(result.status).toBe('scraped');
      expect(result.date).toBeDefined();
    });

    it('should remove undefined fields', () => {
      const rawJob = {
        url: 'https://test.com/1',
        title: 'Job 1'
      };

      const result = index.mapToJobModel(rawJob, '32971419');

      expect(result.location).toBeUndefined();
      expect(result.tags).toBeUndefined();
      expect(result.workmode).toBeUndefined();
    });

    it('should handle missing title', () => {
      const rawJob = { url: 'https://test.com/1' };

      const result = index.mapToJobModel(rawJob, '32971419');

      expect(result.title).toBeUndefined();
      expect(result.url).toBe('https://test.com/1');
    });
  });

  describe('parseJobsPage', () => {
    it('should parse BambooHR JSON results', () => {
      const result = index.parseJobsPage(sampleBambooData);

      expect(result.total).toBe(2);
      expect(result.jobs).toHaveLength(2);

      const first = result.jobs[0];
      expect(first.title).toBe('Full Stack Developer');
      expect(first.url).toBe('https://tecss.bamboohr.com/careers/72');
      expect(first.location).toEqual(['Cluj-Napoca', 'Romania']);
      expect(first.workmode).toBe('hybrid');
      expect(first.uid).toBe('72');

      const second = result.jobs[1];
      expect(second.workmode).toBe('remote');
      expect(second.uid).toBe('73');
    });

    it('should map locationType 1 to on-site', () => {
      const data = {
        meta: { totalCount: 1 },
        result: [
          {
            id: "80",
            jobOpeningName: "Office Engineer",
            location: { city: "Cluj-Napoca", state: "Romania" },
            locationType: "1"
          }
        ]
      };

      const result = index.parseJobsPage(data);

      expect(result.jobs[0].workmode).toBe('on-site');
    });

    it('should handle empty results', () => {
      const result = index.parseJobsPage({ meta: { totalCount: 0 }, result: [] });

      expect(result.jobs).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle missing data', () => {
      const result = index.parseJobsPage(null);

      expect(result.jobs).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle missing location', () => {
      const data = {
        meta: { totalCount: 1 },
        result: [
          {
            id: "90",
            jobOpeningName: "Remote Engineer",
            location: null,
            locationType: "3"
          }
        ]
      };

      const result = index.parseJobsPage(data);

      expect(result.jobs[0].location).toEqual([]);
      expect(result.jobs[0].workmode).toBe('remote');
    });
  });
});
