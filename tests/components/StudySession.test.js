import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import StudySession from '@/components/session/StudySession.vue'

describe('StudySession Component', () => {
  let wrapper

  const mockSession = {
    id: 'session-1',
    currentRound: 1,
    totalRounds: 3,
    cardsCompleted: 10,
    cardsRemaining: 40,
    status: 'active'
  }

  beforeEach(() => {
    wrapper = mount(StudySession, {
      props: {
        session: mockSession
      }
    })
  })

  describe('Session Display', () => {
    it('should show progress indicators', () => {
      expect(wrapper.text()).toContain('10/50') // Progress
      expect(wrapper.text()).toContain('40') // Remaining
    })

    it('should display round information', () => {
      expect(wrapper.text()).toContain('Round 1 of 3')
    })

    it('should show session status', () => {
      const statusElement = wrapper.find('[data-testid="session-status"]')
      expect(statusElement.text()).toContain('active')
    })
  })

  describe('Card Presentation', () => {
    it('should show loading state when fetching next card', async () => {
      await wrapper.setProps({ loading: true })
      
      const loadingElement = wrapper.find('[data-testid="loading"]')
      expect(loadingElement.exists()).toBe(true)
      expect(loadingElement.text()).toContain('Loading words')
    })

    it('should display single word card', async () => {
      const mockCard = {
        id: 'card-1',
        word: 'bonjour',
        translation: 'hello'
      }
      
      await wrapper.setProps({ 
        currentCard: mockCard,
        cardType: 'single'
      })
      
      const wordCard = wrapper.findComponent({ name: 'WordCard' })
      expect(wordCard.exists()).toBe(true)
    })

    it('should display comparison mode for multiple cards', async () => {
      const mockCards = [
        { id: 'card-1', word: 'chien' },
        { id: 'card-2', word: 'chat' }
      ]
      
      await wrapper.setProps({ 
        currentCards: mockCards,
        cardType: 'comparison'
      })
      
      const comparisonMode = wrapper.findComponent({ name: 'ComparisonMode' })
      expect(comparisonMode.exists()).toBe(true)
    })
  })

  describe('Session Controls', () => {
    it('should show control panel', () => {
      const controlPanel = wrapper.find('[data-testid="control-panel"]')
      expect(controlPanel.exists()).toBe(true)
    })

    it('should emit pause-session when pause button clicked', async () => {
      const pauseButton = wrapper.find('[data-testid="pause-button"]')
      await pauseButton.trigger('click')
      
      expect(wrapper.emitted('pause-session')).toBeTruthy()
    })

    it('should emit end-session when back button clicked', async () => {
      const backButton = wrapper.find('[data-testid="back-button"]')
      await backButton.trigger('click')
      
      expect(wrapper.emitted('end-session')).toBeTruthy()
    })

    it('should handle undo action', async () => {
      const undoButton = wrapper.find('[data-testid="undo-button"]')
      await undoButton.trigger('click')
      
      expect(wrapper.emitted('undo-action')).toBeTruthy()
    })
  })

  describe('Session Completion', () => {
    it('should show completion celebration', async () => {
      await wrapper.setProps({ 
        session: { ...mockSession, status: 'completed' }
      })
      
      const celebration = wrapper.find('[data-testid="completion-celebration"]')
      expect(celebration.exists()).toBe(true)
    })

    it('should display session summary', async () => {
      const mockSummary = {
        totalCards: 50,
        rememberedCards: 35,
        forgottenCards: 15,
        timeSpent: 12,
        averageResponseTime: 2.5
      }
      
      await wrapper.setProps({ 
        sessionSummary: mockSummary,
        session: { ...mockSession, status: 'completed' }
      })
      
      expect(wrapper.text()).toContain('35 remembered')
      expect(wrapper.text()).toContain('15 forgotten')
      expect(wrapper.text()).toContain('12 minutes')
    })

    it('should emit return-to-menu from summary', async () => {
      await wrapper.setProps({ 
        session: { ...mockSession, status: 'completed' }
      })
      
      const returnButton = wrapper.find('[data-testid="return-menu-button"]')
      await returnButton.trigger('click')
      
      expect(wrapper.emitted('return-to-menu')).toBeTruthy()
    })
  })

  describe('Progress Animation', () => {
    it('should animate progress bar updates', async () => {
      const progressBar = wrapper.find('[data-testid="progress-bar"]')
      const initialWidth = progressBar.element.style.width
      
      await wrapper.setProps({
        session: { ...mockSession, cardsCompleted: 20 }
      })
      
      const newWidth = progressBar.element.style.width
      expect(newWidth).not.toBe(initialWidth)
    })

    it('should show celebration animation on round completion', async () => {
      await wrapper.setProps({
        session: { ...mockSession, currentRound: 2, cardsCompleted: 50 }
      })
      
      const celebration = wrapper.find('[data-testid="round-celebration"]')
      expect(celebration.exists()).toBe(true)
    })
  })

  describe('Retry Cards Management', () => {
    it('should show retry cards waiting timer', async () => {
      const retryCards = [
        { cardId: 'card-1', word: 'test', remainingTime: 300 }
      ]
      
      await wrapper.setProps({ retryCards })
      
      const timer = wrapper.find('[data-testid="retry-timer"]')
      expect(timer.exists()).toBe(true)
      expect(timer.text()).toContain('05:00')
    })

    it('should emit skip-retry when skip button clicked', async () => {
      const retryCards = [
        { cardId: 'card-1', word: 'test', remainingTime: 300 }
      ]
      
      await wrapper.setProps({ retryCards })
      
      const skipButton = wrapper.find('[data-testid="skip-retry-button"]')
      await skipButton.trigger('click')
      
      expect(wrapper.emitted('skip-retry')).toBeTruthy()
    })

    it('should emit skip-all-retry for skip all button', async () => {
      const retryCards = [
        { cardId: 'card-1', word: 'test1', remainingTime: 300 },
        { cardId: 'card-2', word: 'test2', remainingTime: 600 }
      ]
      
      await wrapper.setProps({ retryCards })
      
      const skipAllButton = wrapper.find('[data-testid="skip-all-retry-button"]')
      await skipAllButton.trigger('click')
      
      expect(wrapper.emitted('skip-all-retry')).toBeTruthy()
    })
  })

  describe('Mobile Interface', () => {
    it('should show hamburger menu on mobile', async () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 500 })
      window.dispatchEvent(new Event('resize'))
      
      await wrapper.vm.$nextTick()
      
      const hamburger = wrapper.find('[data-testid="hamburger-menu"]')
      expect(hamburger.exists()).toBe(true)
    })

    it('should show bottom sheet menu when hamburger clicked', async () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 500 })
      window.dispatchEvent(new Event('resize'))
      
      await wrapper.vm.$nextTick()
      
      const hamburger = wrapper.find('[data-testid="hamburger-menu"]')
      await hamburger.trigger('click')
      
      const bottomSheet = wrapper.find('[data-testid="bottom-sheet"]')
      expect(bottomSheet.classes()).toContain('open')
    })
  })

  describe('Keyboard Shortcuts', () => {
    it('should handle space key for reveal', async () => {
      await wrapper.trigger('keydown', { key: ' ' })
      expect(wrapper.emitted('reveal-card')).toBeTruthy()
    })

    it('should handle arrow keys for card actions', async () => {
      await wrapper.trigger('keydown', { key: 'ArrowUp' })
      expect(wrapper.emitted('card-action')).toBeTruthy()
      expect(wrapper.emitted('card-action')[0][1]).toBe('remember')
      
      await wrapper.trigger('keydown', { key: 'ArrowLeft' })
      expect(wrapper.emitted('card-action')).toBeTruthy()
      expect(wrapper.emitted('card-action')[1][1]).toBe('not-remember')
    })

    it('should handle P key for audio playback', async () => {
      await wrapper.trigger('keydown', { key: 'p' })
      expect(wrapper.emitted('play-audio')).toBeTruthy()
    })
  })
})