import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { PlanTermController } from './planTerm.controller';
import { PlanTermService } from './planTerm.service';
import { buildAuthzApp, tokenFor } from '../../auth/testing/authz-harness';

// The authorization surface of the plan-term routes. The controller carries a
// class-level @Auth(Role.ADMIN) — deny by default, so a route added later
// without its own decorator is still guarded — with GET by-plan/:planId
// widened to Role.USER, since a member choosing a plan has to see the terms
// on offer.
describe('PlanTermController authorization', () => {
  let app: INestApplication;
  let planTermService: {
    createTerm: jest.Mock;
    findAll: jest.Mock;
    findForPlan: jest.Mock;
    findAllDeleted: jest.Mock;
    findTerm: jest.Mock;
    updateTerm: jest.Mock;
    deleteTerm: jest.Mock;
    restoreTerm: jest.Mock;
  };

  beforeAll(async () => {
    planTermService = {
      createTerm: jest.fn().mockResolvedValue({}),
      findAll: jest.fn().mockResolvedValue([]),
      findForPlan: jest.fn().mockResolvedValue([]),
      findAllDeleted: jest.fn().mockResolvedValue([]),
      findTerm: jest.fn().mockResolvedValue({}),
      updateTerm: jest.fn().mockResolvedValue({}),
      deleteTerm: jest.fn().mockResolvedValue({}),
      restoreTerm: jest.fn().mockResolvedValue({}),
    };

    app = await buildAuthzApp(PlanTermController, [
      { provide: PlanTermService, useValue: planTermService },
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const server = () => request(app.getHttpServer() as App);

  describe('the admin-only routes', () => {
    it('refuses an anonymous request to GET /plan-term', async () => {
      await server().get('/api/v1/plan-term').expect(401);

      expect(planTermService.findAll).not.toHaveBeenCalled();
    });

    it('refuses a member on GET /plan-term', async () => {
      await server()
        .get('/api/v1/plan-term')
        .set('Authorization', `Bearer ${tokenFor('member')}`)
        .expect(403);

      expect(planTermService.findAll).not.toHaveBeenCalled();
    });

    it('lets an admin through on GET /plan-term', async () => {
      await server()
        .get('/api/v1/plan-term')
        .set('Authorization', `Bearer ${tokenFor('admin')}`)
        .expect(200);

      expect(planTermService.findAll).toHaveBeenCalled();
    });

    it('refuses an anonymous POST /plan-term', async () => {
      await server().post('/api/v1/plan-term').send({}).expect(401);

      expect(planTermService.createTerm).not.toHaveBeenCalled();
    });

    it('refuses a member on POST /plan-term', async () => {
      await server()
        .post('/api/v1/plan-term')
        .set('Authorization', `Bearer ${tokenFor('member')}`)
        .send({})
        .expect(403);

      expect(planTermService.createTerm).not.toHaveBeenCalled();
    });

    it('refuses a member on DELETE /plan-term/:id', async () => {
      await server()
        .delete('/api/v1/plan-term/1')
        .set('Authorization', `Bearer ${tokenFor('member')}`)
        .expect(403);

      expect(planTermService.deleteTerm).not.toHaveBeenCalled();
    });

    it('refuses a member on GET /plan-term/filter/deleted', async () => {
      await server()
        .get('/api/v1/plan-term/filter/deleted')
        .set('Authorization', `Bearer ${tokenFor('member')}`)
        .expect(403);

      expect(planTermService.findAllDeleted).not.toHaveBeenCalled();
    });
  });

  describe('GET /plan-term/by-plan/:planId', () => {
    it('still lets a member read the terms on offer for a plan', async () => {
      // The class-level ADMIN default must not close this one: it is what the
      // plan-change / checkout flow reads.
      await server()
        .get('/api/v1/plan-term/by-plan/3')
        .set('Authorization', `Bearer ${tokenFor('member')}`)
        .expect(200);

      expect(planTermService.findForPlan).toHaveBeenCalledWith(3);
    });

    it('lets an admin read it too', async () => {
      await server()
        .get('/api/v1/plan-term/by-plan/3')
        .set('Authorization', `Bearer ${tokenFor('admin')}`)
        .expect(200);

      expect(planTermService.findForPlan).toHaveBeenCalledWith(3);
    });

    it('still requires a login', async () => {
      await server().get('/api/v1/plan-term/by-plan/3').expect(401);

      expect(planTermService.findForPlan).not.toHaveBeenCalled();
    });
  });
});
