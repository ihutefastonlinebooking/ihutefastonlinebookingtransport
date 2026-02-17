import React from 'react';

export const Container = ({ children, className = '' }) => {
  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
};

export const Header = ({ children, className = '' }) => {
  return (
    <header className={`bg-white shadow ${className}`}>
      <Container className="py-6">
        {children}
      </Container>
    </header>
  );
};

export const Footer = ({ children, className = '' }) => {
  return (
    <footer className={`bg-dark text-white ${className}`}>
      <Container className="py-8">
        {children}
      </Container>
    </footer>
  );
};

export const Main = ({ children, className = '' }) => {
  return (
    <main className={`min-h-screen bg-light ${className}`}>
      <Container className="py-8">
        {children}
      </Container>
    </main>
  );
};

export default { Container, Header, Footer, Main };
