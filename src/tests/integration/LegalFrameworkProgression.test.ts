// src/tests/integration/LegalFrameworkProgression.test.ts

import { expect } from 'chai';
import { setupLegalTestContext, progressToLevel, LegalTestContext } from '../utils/legalTestUtils';
import { LEGAL_CONCEPTS } from '../../constants/legalConcepts';
import 'jest';

// Import actual types from ContractService
import { ContractService, DomainState, DomainStateType } from '../../views/components/dashboard/contractService';

describe('Legal Framework Progression', () => {
  let context: LegalTestContext;

  beforeEach(async () => {
    context = await setupLegalTestContext();
  });

  describe('Foundation Layer (0-8.33)', () => {
    it('should start at Legal Ground Zero', async () => {
      // Get the domain state instead of just the state
      const domainState = await context.contractService.getDomainState();
      expect(domainState.level).to.equal(0);
    });

    it('should progress through Rights states correctly', async () => {
      // Progress to Primary Right
      await progressToLevel(context, 0.925925926);
      let domainState = await context.contractService.getDomainState();
      expect(domainState.level).to.be.closeTo(0.925925926, 0.000000001);
      expect(domainState.capabilities).to.include('BASIC_RIGHTS');

      // Progress to Secondary Right
      await progressToLevel(context, 1.851851852);
      domainState = await context.contractService.getDomainState();
      expect(domainState.level).to.be.closeTo(1.851851852, 0.000000001);
      expect(domainState.capabilities).to.include('INTERMEDIATE_RIGHTS');
    });

    it('should enforce requirements for Power States', async () => {
      // Test progression to First Power State
      await progressToLevel(context, 3.703703704);
      const domainState = await context.contractService.getDomainState();
      
      // Verify requirements are met using the validateStateRequirements method
      const requirementsMet = await context.contractService.validateStateRequirements(
        context.accounts[0].address,
        domainState.level
      );
      expect(requirementsMet).to.be.true;
    });
  });

  describe('Authority Layer (8.33-16.67)', () => {
    beforeEach(async () => {
      // Start from Formation Nexus
      await progressToLevel(context, 8.333333333);
    });

    it('should validate Authority transition requirements', async () => {
      const domainState = await context.contractService.getDomainState();
      expect(domainState.level).to.be.closeTo(8.333333333, 0.000000001);
      
      // Verify Authority capabilities
      expect(domainState.capabilities).to.include('FORMATION_COMPLETE');
    });

    it('should progress through Authority states with proper governance weight', async () => {
      // Progress to First Authority
      await progressToLevel(context, 13.88888889);
      const domainState = await context.contractService.getDomainState();
      
      // Verify governance weight increases
      expect(domainState.governanceWeight).to.be.gt(1);
    });
  });

  describe('Field Metrics Integration', () => {
    it('should track field metrics during state changes', async () => {
      // Get initial field metrics
      const initialMetrics = await context.contractService.getFieldMetrics();
      
      // Progress through a state
      await progressToLevel(context, 0.925925926);
      
      // Get updated field metrics
      const updatedMetrics = await context.contractService.getFieldMetrics();
      
      // Verify metrics are being tracked
      expect(updatedMetrics.fieldStrength).to.be.a('number');
      expect(updatedMetrics.fieldSynchronization).to.be.a('number');
      expect(updatedMetrics.unityProgress).to.be.a('number');
    });

    it('should calculate foundation metrics correctly', async () => {
      const metrics = await context.contractService.getMetrics(context.accounts[0].address);
      
      expect(metrics.tokenMetrics).to.exist;
      expect(metrics.fieldMetrics).to.exist;
      expect(metrics.balance).to.exist;
      expect(metrics.activityScore).to.be.a('number');
    });
  });

  describe('Activity and Requirements', () => {
    it('should track activity metrics', async () => {
      const activityScore = await context.contractService.getActivityScore(context.accounts[0].address);
      expect(activityScore).to.be.a('number');
    });

    it('should validate state requirements comprehensively', async () => {
      const domainState = await context.contractService.getDomainState();
      
      // Check all requirements
      const meetsRequirements = await context.contractService.validateStateRequirements(
        context.accounts[0].address,
        domainState.level
      );
      
      expect(meetsRequirements).to.be.a('boolean');
    });
  });

  /* Entire test needs to be refactored to take into account the actual render() function, if it even exists, and how it should parse components. Probably have to move it to a new .tsx file to take into account element rendering, which will be done later
  
  describe('Component Integration Tests', () => {
    it('should update UI components on state changes', async () => {
      // Create test renderer
      const { getByTestId } = render(
        <LegalProgressionSystem
          address={context.accounts[0].address}
        />
      );

      // Progress state
      await progressToLevel(context, 0.925925926);

      // Verify UI updates
      expect(getByTestId('legal-level')).to.have.textContent('0.925925926');
      expect(getByTestId('capability-badge')).to.have.textContent('BASIC_RIGHTS');
    });

    it('should properly integrate with TokenMetrics', async () => {
      const { getByTestId } = render(
        <Grid container>
          <TokenMetrics />
          <LegalProgressionSystem
            address={context.accounts[0].address}
          />
        </Grid>
      );

      // Progress through state
      await progressToLevel(context, 0.925925926);

      // Verify TokenMetrics updates appropriately
      expect(getByTestId('governance-weight')).to.have.textContent('1.0');
    });
  }); */
});
