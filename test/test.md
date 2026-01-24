# Gummy Test

This is a test of the gummy markdown renderer.

## A Simple Plot

Here's a sine wave:

```gum
<Plot xlim={[0, 2*pi]} ylim={[-1.5, 1.5]} grid margin={[0.2, 0.1]} aspect={2}>
  <SymLine fy={sin} stroke={blue} stroke-width={2} />
</Plot>
```

## More Text

The plot above should render inline in your terminal!

## Another Example

```gum
<Frame rounded padding>
  <Circle fill={blue} />
</Frame>
```

That's a blue circle.

