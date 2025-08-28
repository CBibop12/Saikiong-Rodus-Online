// pages/RulesPage.jsx
import React, { useState, useEffect } from 'react';
import { rulesText } from '..https://pdjerosynzbsjmwqdxbr.supabase.co/storage/v1/object/public/images/rules'
import "../styles/rulesStyle.css"

const RulesPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sections, setSections] = useState([]);
  const [searchResults, setSearchResults] = useState([]); // массив найденных совпадений
  const [currentMatch, setCurrentMatch] = useState(0); // текущее совпадение

  useEffect(() => {
    // Разбираем текст на секции при первой загрузке компонента
    parseRules(rulesText);
  }, []);

  const parseRules = (text) => {
    let parsedSections = [];
    let currentSection = null;

    // Получаем все секции
    const sections = text.match(/<title>(.*?)<\/title>.*?(?=<title>|$)/gs) || [];

    sections.forEach(sectionText => {
      // Извлекаем заголовок секции
      const titleMatch = sectionText.match(/<title>(.*?)<\/title>/);
      if (titleMatch) {
        currentSection = {
          title: titleMatch[1].trim(),
          content: '',
          subsections: []
        };

        // Получаем весь текст после заголовка
        let remainingText = sectionText
          .replace(/<title>.*?<\/title>/, '')
          .trim();

        // Разбиваем на части по подсекциям
        const subSections = remainingText.split(/<subtitle>/);

        // Первая часть - основной контент секции
        currentSection.content = formatText(subSections[0].trim());

        // Обрабатываем подсекции
        for (let i = 1; i < subSections.length; i++) {
          const subSectionParts = subSections[i].split('</subtitle>');
          if (subSectionParts.length === 2) {
            currentSection.subsections.push({
              title: subSectionParts[0].trim(),
              content: formatText(subSectionParts[1].trim())
            });
          }
        }

        parsedSections.push(currentSection);
      }
    });

    setSections(parsedSections);
  };

  // Функция для форматирования текста
  const formatText = (text) => {
    return text
      .split('\n')
      .map(line => {
        // Добавляем два переноса строки перед маркерами и нумерованными пунктами
        const trimmedLine = line.trim();
        if (trimmedLine.match(/^(●|○|\d+\.)/)) {
          return `\n\n${trimmedLine}`;
        }
        return line;
      })
      .join('\n')
      .replace(/\n{3,}/g, '\n\n'); // Убираем лишние переносы строк
  };

  const findAllMatches = (query) => {
    if (!query) {
      setSearchResults([]);
      return;
    }

    const results = [];
    sections.forEach((section, sectionIndex) => {
      // Поиск в основном контенте
      const matches = [...section.content.matchAll(new RegExp(query, 'gi'))];
      matches.forEach(match => {
        results.push({
          sectionIndex,
          subsectionIndex: null,
          index: match.index,
          text: match[0]
        });
      });

      // Поиск в подсекциях
      section.subsections.forEach((subsection, subsectionIndex) => {
        const subMatches = [...subsection.content.matchAll(new RegExp(query, 'gi'))];
        subMatches.forEach(match => {
          results.push({
            sectionIndex,
            subsectionIndex,
            index: match.index,
            text: match[0]
          });
        });
      });
    });

    setSearchResults(results);
    setCurrentMatch(0);

    // Прокрутка к первому совпадению
    if (results.length > 0) {
      scrollToMatch(results[0]);
    }
  };

  // Прокрутка к определенному совпадению
  const scrollToMatch = (match) => {
    const element = document.getElementById(
      match.subsectionIndex !== null
        ? `section-${match.sectionIndex}-${match.subsectionIndex}`
        : `section-${match.sectionIndex}`
    );
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Подсветка текущего совпадения
  const highlightText = (text, query) => {
    if (!query) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => {
      if (part.toLowerCase() === query.toLowerCase()) {
        return <mark key={i} className="highlight-current">{part}</mark>;
      }
      return part;
    });
  };

  const searchInContent = (query) => {
    if (!query) return sections;

    return sections.map(section => {
      const sectionContent = highlightText(section.content, query);
      const matchingSubsections = section.subsections.map(sub => ({
        ...sub,
        content: highlightText(sub.content, query)
      }));

      return {
        ...section,
        content: sectionContent,
        subsections: matchingSubsections
      };
    });
  };


  return (
    <div className="rules-container">
      <nav className="rules-nav">
        <div className="search-container">
          <div className="search-box">
            {/*Добавь стрелку для выхода на главную страницу*/}
            <button className="back-button" onClick={() => window.location.href = '/'}>
              ←
            </button>
            <input
              type="text"
              placeholder="Поиск по правилам..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                findAllMatches(e.target.value);
              }}
            />
            {searchResults.length > 0 && (
              <div className="search-info">
                {currentMatch + 1} из {searchResults.length}
              </div>
            )}
          </div>
          {searchResults.length > 0 && (
            <div className="search-navigation">
              <button
                onClick={() => {
                  const newIndex = (currentMatch - 1 + searchResults.length) % searchResults.length;
                  setCurrentMatch(newIndex);
                  scrollToMatch(searchResults[newIndex]);
                }}
              >
                ↑
              </button>
              <button
                onClick={() => {
                  const newIndex = (currentMatch + 1) % searchResults.length;
                  setCurrentMatch(newIndex);
                  scrollToMatch(searchResults[newIndex]);
                }}
              >
                ↓
              </button>
            </div>
          )}
        </div>
        <div className="sections-list">
          {sections.map((section, index) => (
            <div key={index} className="section-item">
              <a href={`#section-${index}`}>
                {section.title}
              </a>
              {section.subsections.map((sub, subIndex) => (
                <a
                  key={`${index}-${subIndex}`}
                  href={`#section-${index}-${subIndex}`}
                  className="subsection-link"
                >
                  {sub.title}
                </a>
              ))}
            </div>
          ))}
        </div>
      </nav>
      <main className="rules-content">
        {searchInContent(searchQuery).map((section, index) => (
          <section key={index} id={`section-${index}`}>
            <h2 className="rules-title">{section.title}</h2>
            <div className="rules-content-text">{section.content}</div>
            {section.subsections.map((sub, subIndex) => (
              <div key={`${index}-${subIndex}`} id={`section-${index}-${subIndex}`}>
                <h3 className="rules-subtitle">{sub.title}</h3>
                <div className="rules-subcontent-text">{sub.content}</div>
              </div>
            ))}
          </section>
        ))}
      </main>
    </div>
  );
};

export default RulesPage;