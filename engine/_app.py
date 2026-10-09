"""
Lightweight application context and stub decorators.
"""

class _DummyMCP:
    def tool(self, *args, **kwargs):
        def decorator(f):
            return f
        return decorator

    def prompt(self, *args, **kwargs):
        def decorator(f):
            return f
        return decorator

    def resource(self, *args, **kwargs):
        def decorator(f):
            return f
        return decorator

mcp = _DummyMCP()
