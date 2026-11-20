import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { error: null, resetKey: this.props.resetKey }

  static getDerivedStateFromError(error) { return { error } }

  static getDerivedStateFromProps(props, state) {
    return props.resetKey !== state.resetKey ? { error: null, resetKey: props.resetKey } : null
  }

  componentDidCatch(error, info) {
    console.error('Lỗi render giao diện:', error, info.componentStack)
  }

  render() {
    if (this.state.error) return <section role="alert" className="panel"><h2>Không thể hiển thị nội dung này</h2><p>Đã xảy ra lỗi khi tải giao diện. Vui lòng thử lại.</p><button type="button" onClick={() => this.setState({ error: null })}>Thử lại</button></section>
    return this.props.children
  }
}
