import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import WordCard from '@/components/cards/WordCard.vue'

describe('WordCard Component', () => {
  let wrapper

  const mockWordCard = {
    id: 'test-word-1',
    word: 'bonjour',
    translation: 'hello',
    partOfSpeech: 'interjection',
    hint: 'common greeting',
    audioUrl: '/audio/bonjour.mp3'
  }

  beforeEach(() => {
    wrapper = mount(WordCard, {
      props: {
        wordCard: mockWordCard,
        revealed: false
      }
    })
  })

  describe('Card Display', () => {
    it('should render word and part of speech', () => {
      expect(wrapper.text()).toContain('bonjour')
      expect(wrapper.text()).toContain('interjection')
    })

    it('should not show translation when not revealed', () => {
      expect(wrapper.text()).not.toContain('hello')
    })

    it('should show translation when revealed', async () => {
      await wrapper.setProps({ revealed: true })
      expect(wrapper.text()).toContain('hello')
    })

    it('should show hint when revealed', async () => {
      await wrapper.setProps({ revealed: true })
      expect(wrapper.text()).toContain('common greeting')
    })
  })

  describe('Audio Interaction', () => {
    it('should emit audio-play event when word is clicked', async () => {
      const wordElement = wrapper.find('[data-testid="word"]')
      await wordElement.trigger('click')
      
      expect(wrapper.emitted('audio-play')).toBeTruthy()
      expect(wrapper.emitted('audio-play')[0]).toEqual([mockWordCard.id])
    })

    it('should show audio playing state', async () => {
      await wrapper.setProps({ audioPlaying: true })
      const wordElement = wrapper.find('[data-testid="word"]')
      expect(wordElement.classes()).toContain('audio-playing')
    })
  })

  describe('Card Actions', () => {
    it('should show reveal button when not revealed', () => {
      const revealButton = wrapper.find('[data-testid="reveal-button"]')
      expect(revealButton.exists()).toBe(true)
    })

    it('should show action buttons when revealed', async () => {
      await wrapper.setProps({ revealed: true })
      
      const rememberButton = wrapper.find('[data-testid="remember-button"]')
      const notRememberButton = wrapper.find('[data-testid="not-remember-button"]')
      
      expect(rememberButton.exists()).toBe(true)
      expect(notRememberButton.exists()).toBe(true)
    })

    it('should emit card-action event for remember', async () => {
      await wrapper.setProps({ revealed: true })
      
      const rememberButton = wrapper.find('[data-testid="remember-button"]')
      await rememberButton.trigger('click')
      
      expect(wrapper.emitted('card-action')).toBeTruthy()
      expect(wrapper.emitted('card-action')[0]).toEqual([mockWordCard.id, 'remember'])
    })

    it('should emit card-action event for not-remember', async () => {
      await wrapper.setProps({ revealed: true })
      
      const notRememberButton = wrapper.find('[data-testid="not-remember-button"]')
      await notRememberButton.trigger('click')
      
      expect(wrapper.emitted('card-action')).toBeTruthy()
      expect(wrapper.emitted('card-action')[0]).toEqual([mockWordCard.id, 'not-remember'])
    })
  })

  describe('Touch Gestures', () => {
    it('should emit swipe-up event for remember gesture', async () => {
      const card = wrapper.find('[data-testid="word-card"]')
      
      // Simulate swipe up
      await card.trigger('touchstart', { touches: [{ clientY: 100 }] })
      await card.trigger('touchend', { changedTouches: [{ clientY: 50 }] })
      
      expect(wrapper.emitted('card-action')).toBeTruthy()
      expect(wrapper.emitted('card-action')[0][1]).toBe('remember')
    })

    it('should emit swipe-left event for not-remember gesture', async () => {
      const card = wrapper.find('[data-testid="word-card"]')
      
      // Simulate swipe left
      await card.trigger('touchstart', { touches: [{ clientX: 100 }] })
      await card.trigger('touchend', { changedTouches: [{ clientX: 50 }] })
      
      expect(wrapper.emitted('card-action')).toBeTruthy()
      expect(wrapper.emitted('card-action')[0][1]).toBe('not-remember')
    })
  })

  describe('Responsive Design', () => {
    it('should apply mobile-specific styles on small screens', async () => {
      // Mock small screen size
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 500 })
      window.dispatchEvent(new Event('resize'))
      
      await wrapper.vm.$nextTick()
      
      const card = wrapper.find('[data-testid="word-card"]')
      expect(card.classes()).toContain('mobile-layout')
    })

    it('should apply desktop styles on larger screens', async () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 1200 })
      window.dispatchEvent(new Event('resize'))
      
      await wrapper.vm.$nextTick()
      
      const card = wrapper.find('[data-testid="word-card"]')
      expect(card.classes()).toContain('desktop-layout')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      const wordElement = wrapper.find('[data-testid="word"]')
      expect(wordElement.attributes('aria-label')).toContain('pronunciation')
    })

    it('should support keyboard navigation', async () => {
      const revealButton = wrapper.find('[data-testid="reveal-button"]')
      
      await revealButton.trigger('keydown', { key: 'Enter' })
      expect(wrapper.emitted('reveal')).toBeTruthy()
      
      await revealButton.trigger('keydown', { key: ' ' })
      expect(wrapper.emitted('reveal')).toBeTruthy()
    })
  })
})