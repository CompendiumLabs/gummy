# Gummy Test

This is a test of the gummy markdown renderer.

## A Simple Plot

Here's a sine wave:

```gum
<Plot xlim={[0, 2*pi]} ylim={[-1.5, 1.5]} grid margin={[0.2, 0.1]} aspect={2}>
  <SymLine fy={sin} stroke={blue} stroke-width={2} />
</Plot>
```

## Render Arguments

Let's pass a width specifier:

```gum height=300
<Box margin>
  <Circle fill={blue} stroke={none} />
</Box>
```

That's a blue circle.

## Regular Images

We can also include regular SVG/PNG images:

![height=300](test/snake.svg)

Hooray!

