import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ComparisonMode from '@/components/cards/ComparisonMode.vue'

describe('ComparisonMode Component', () => {
  let wrapper

  const mockWordCards = [
    {
      id: 'word-1',
      word: 'chien',
      translation: 'dog',
      partOfSpeech: 'noun',
      hint: 'domestic animal'
    },
    {
      id: 'word-2', 
      word: 'chat',
      translation: 'cat',
      partOfSpeech: 'noun',
      hint: 'feline pet'
    },
    {
      id: 'word-3',
      word: 'cheval',
      translation: 'horse',
      partOfSpeech: 'noun',
      hint: 'large mammal'
    }
  ]

  beforeEach(() => {
    wrapper = mount(ComparisonMode, {
      props: {
        wordCards: mockWordCards,
        highlightedCardId: 'word-1'
      }
    })
  })

  describe('Card Layout', () => {
    it('should render all word cards in comparison', () => {
      const cards = wrapper.findAll('[data-testid="comparison-card"]')
      expect(cards).toHaveLength(3)
    })

    it('should highlight the first card by default', () => {
      const highlightedCard = wrapper.find('[data-testid="comparison-card"].highlighted')
      expect(highlightedCard.exists()).toBe(true)
    })

    it('should show cards in responsive grid layout', () => {
      const container = wrapper.find('[data-testid="comparison-container"]')
      expect(container.classes()).toContain('comparison-grid')
    })
  })

  describe('Card Interaction', () => {
    it('should highlight card when clicked', async () => {
      const secondCard = wrapper.findAll('[data-testid="comparison-card"]')[1]
      await secondCard.trigger('click')
      
      expect(wrapper.emitted('card-highlight')).toBeTruthy()
      expect(wrapper.emitted('card-highlight')[0]).toEqual(['word-2'])
    })

    it('should play audio when card is highlighted', async () => {
      const secondCard = wrapper.findAll('[data-testid="comparison-card"]')[1]
      await secondCard.trigger('click')
      
      expect(wrapper.emitted('audio-play')).toBeTruthy()
      expect(wrapper.emitted('audio-play')[0]).toEqual(['word-2'])
    })

    it('should reveal individual cards independently', async () => {
      const revealButton = wrapper.find('[data-testid="reveal-button-word-1"]')
      await revealButton.trigger('click')
      
      expect(wrapper.emitted('card-reveal')).toBeTruthy()
      expect(wrapper.emitted('card-reveal')[0]).toEqual(['word-1'])
    })
  })

  describe('Card Actions', () => {
    it('should handle remember action for individual cards', async () => {
      // First reveal the card
      await wrapper.setProps({ 
        revealedCards: new Set(['word-1']) 
      })
      
      const rememberButton = wrapper.find('[data-testid="remember-button-word-1"]')
      await rememberButton.trigger('click')
      
      expect(wrapper.emitted('card-action')).toBeTruthy()
      expect(wrapper.emitted('card-action')[0]).toEqual(['word-1', 'remember'])
    })

    it('should handle not-remember action for individual cards', async () => {
      await wrapper.setProps({ 
        revealedCards: new Set(['word-2']) 
      })
      
      const notRememberButton = wrapper.find('[data-testid="not-remember-button-word-2"]')
      await notRememberButton.trigger('click')
      
      expect(wrapper.emitted('card-action')).toBeTruthy()
      expect(wrapper.emitted('card-action')[0]).toEqual(['word-2', 'not-remember'])
    })

    it('should disable swipe gestures in comparison mode', async () => {
      const container = wrapper.find('[data-testid="comparison-container"]')
      
      // Simulate swipe gesture
      await container.trigger('touchstart', { touches: [{ clientY: 100 }] })
      await container.trigger('touchend', { changedTouches: [{ clientY: 50 }] })
      
      // Should not emit card-action from swipe
      expect(wrapper.emitted('card-action')).toBeFalsy()
    })
  })

  describe('Responsive Layout', () => {
    it('should show single column on mobile', async () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 500 })
      window.dispatchEvent(new Event('resize'))
      
      await wrapper.vm.$nextTick()
      
      const container = wrapper.find('[data-testid="comparison-container"]')
      expect(container.classes()).toContain('mobile-single-column')
    })

    it('should show 2 columns on tablet', async () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 800 })
      window.dispatchEvent(new Event('resize'))
      
      await wrapper.vm.$nextTick()
      
      const container = wrapper.find('[data-testid="comparison-container"]')
      expect(container.classes()).toContain('tablet-two-columns')
    })

    it('should show grid layout on desktop', async () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 1200 })
      window.dispatchEvent(new Event('resize'))
      
      await wrapper.vm.$nextTick()
      
      const container = wrapper.find('[data-testid="comparison-container"]')
      expect(container.classes()).toContain('desktop-grid')
    })
  })

  describe('Progress Tracking', () => {
    it('should track completion of individual cards', async () => {
      await wrapper.setProps({ 
        completedCards: new Set(['word-1', 'word-2'])
      })
      
      const completedCards = wrapper.findAll('[data-testid="comparison-card"].completed')
      expect(completedCards).toHaveLength(2)
    })

    it('should emit group-complete when all cards are done', async () => {
      await wrapper.setProps({ 
        completedCards: new Set(['word-1', 'word-2', 'word-3'])
      })
      
      expect(wrapper.emitted('group-complete')).toBeTruthy()
    })
  })

  describe('Audio Management', () => {
    it('should show audio playing indicator for highlighted card', async () => {
      await wrapper.setProps({ audioPlayingCardId: 'word-1' })
      
      const audioIndicator = wrapper.find('[data-testid="audio-indicator-word-1"]')
      expect(audioIndicator.classes()).toContain('playing')
    })

    it('should switch audio when highlighting different card', async () => {
      const thirdCard = wrapper.findAll('[data-testid="comparison-card"]')[2]
      await thirdCard.trigger('click')
      
      expect(wrapper.emitted('audio-stop')).toBeTruthy()
      expect(wrapper.emitted('audio-play')).toBeTruthy()
      expect(wrapper.emitted('audio-play')[0]).toEqual(['word-3'])
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels for screen readers', () => {
      const container = wrapper.find('[data-testid="comparison-container"]')
      expect(container.attributes('aria-label')).toContain('comparison mode')
      
      const cards = wrapper.findAll('[data-testid="comparison-card"]')
      cards.forEach((card, index) => {
        expect(card.attributes('role')).toBe('button')
        expect(card.attributes('aria-label')).toContain(`word ${index + 1}`)
      })
    })

    it('should support keyboard navigation between cards', async () => {
      const firstCard = wrapper.find('[data-testid="comparison-card"]')
      
      await firstCard.trigger('keydown', { key: 'ArrowRight' })
      expect(wrapper.emitted('card-highlight')).toBeTruthy()
      expect(wrapper.emitted('card-highlight')[0]).toEqual(['word-2'])
    })

    it('should announce card changes to screen readers', async () => {
      const secondCard = wrapper.findAll('[data-testid="comparison-card"]')[1]
      await secondCard.trigger('click')
      
      const announcement = wrapper.find('[aria-live="polite"]')
      expect(announcement.text()).toContain('chat')
    })
  })
})