#!/usr/bin/env python3
"""
Snyk Buyer Group Transformation Report PDF Generator
Converts the markdown report to a professional PDF with Adrata branding
"""

import os
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
import markdown
from io import StringIO
import re

# Adrata Brand Colors - Predominantly Black/White/Gray with minimal Red
ADRATA_BLACK = colors.Color(0, 0, 0, 1)
ADRATA_WHITE = colors.Color(1, 1, 1, 1)
ADRATA_GRAY = colors.Color(0.3, 0.3, 0.3, 1)
ADRATA_LIGHT_GRAY = colors.Color(0.7, 0.7, 0.7, 1)
ADRATA_VERY_LIGHT_GRAY = colors.Color(0.95, 0.95, 0.95, 1)
ADRATA_RED = colors.Color(0.7, 0.0, 0.0, 1)  # Darker, more subtle red

class AdrataDocTemplate(SimpleDocTemplate):
    """Custom document template with Adrata branding"""
    
    def __init__(self, filename, **kwargs):
        super().__init__(filename, **kwargs)
        
    def build(self, flowables, onFirstPage=None, onLaterPages=None):
        if onFirstPage is None:
            onFirstPage = self._on_first_page
        if onLaterPages is None:
            onLaterPages = self._on_later_pages
        super().build(flowables, onFirstPage=onFirstPage, onLaterPages=onLaterPages)
    
    def _on_first_page(self, canvas, doc):
        self._draw_header_footer(canvas, doc, is_first_page=True)
    
    def _on_later_pages(self, canvas, doc):
        self._draw_header_footer(canvas, doc, is_first_page=False)
    
    def _draw_header_footer(self, canvas, doc, is_first_page=False):
        canvas.saveState()
        
        # Header
        if not is_first_page:
            canvas.setFillColor(ADRATA_GRAY)
            canvas.setFont('Helvetica-Bold', 10)
            canvas.drawString(inch, doc.height + 0.5 * inch, "ADRATA")
            canvas.setFillColor(ADRATA_BLACK)
            canvas.setFont('Helvetica', 8)
            canvas.drawString(inch + 60, doc.height + 0.5 * inch, "BUYER GROUP TRANSFORMATION REPORT")
        
        # Footer
        canvas.setFillColor(ADRATA_GRAY)
        canvas.setFont('Helvetica', 8)
        page_num = canvas.getPageNumber()
        text = f"© 2025 Adrata. Confidential & Proprietary - Page {page_num}"
        text_width = canvas.stringWidth(text, 'Helvetica', 8)
        canvas.drawString((doc.width + 2*inch - text_width) / 2, 0.5 * inch, text)
        
        # Red accent line
        canvas.setStrokeColor(ADRATA_RED)
        canvas.setLineWidth(2)
        canvas.line(inch, doc.height + 0.3 * inch, doc.width + inch, doc.height + 0.3 * inch)
        
        canvas.restoreState()

def create_custom_styles():
    """Create custom paragraph styles for Adrata branding"""
    styles = getSampleStyleSheet()
    
    # Title Style
    styles.add(ParagraphStyle(
        name='AdrataTitle',
        parent=styles['Title'],
        fontSize=24,
        spaceAfter=30,
        textColor=ADRATA_BLACK,
        fontName='Helvetica-Bold',
        alignment=TA_CENTER
    ))
    
    # Subtitle Style
    styles.add(ParagraphStyle(
        name='AdrataSubtitle',
        parent=styles['Heading1'],
        fontSize=16,
        spaceAfter=20,
        textColor=ADRATA_RED,
        fontName='Helvetica-Bold',
        alignment=TA_CENTER
    ))
    
    # Section Heading
    styles.add(ParagraphStyle(
        name='AdrataSectionHeading',
        parent=styles['Heading1'],
        fontSize=18,
        spaceAfter=15,
        spaceBefore=20,
        textColor=ADRATA_BLACK,
        fontName='Helvetica-Bold',
        leftIndent=0
    ))
    
    # Subsection Heading
    styles.add(ParagraphStyle(
        name='AdrataSubsectionHeading',
        parent=styles['Heading2'],
        fontSize=14,
        spaceAfter=10,
        spaceBefore=15,
        textColor=ADRATA_RED,
        fontName='Helvetica-Bold',
        leftIndent=0
    ))
    
    # Body Text
    styles.add(ParagraphStyle(
        name='AdrataBody',
        parent=styles['Normal'],
        fontSize=11,
        spaceAfter=12,
        textColor=ADRATA_BLACK,
        fontName='Helvetica',
        alignment=TA_JUSTIFY,
        leftIndent=0,
        rightIndent=0
    ))
    
    # Bullet Points
    styles.add(ParagraphStyle(
        name='AdrataBullet',
        parent=styles['Normal'],
        fontSize=11,
        spaceAfter=8,
        textColor=ADRATA_BLACK,
        fontName='Helvetica',
        leftIndent=20,
        bulletIndent=10
    ))
    
    # Executive Summary Box
    styles.add(ParagraphStyle(
        name='AdrataExecutiveSummary',
        parent=styles['Normal'],
        fontSize=12,
        spaceAfter=15,
        textColor=ADRATA_BLACK,
        fontName='Helvetica',
        alignment=TA_JUSTIFY,
        leftIndent=20,
        rightIndent=20,
        borderColor=ADRATA_RED,
        borderWidth=1,
        borderPadding=10
    ))
    
    # Confidential Footer
    styles.add(ParagraphStyle(
        name='AdrataConfidential',
        parent=styles['Normal'],
        fontSize=8,
        textColor=ADRATA_GRAY,
        fontName='Helvetica-Bold',
        alignment=TA_CENTER
    ))
    
    return styles

def parse_markdown_content(file_path):
    """Parse the markdown file and extract content sections"""
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    sections = []
    current_section = {"title": "", "content": "", "level": 0}
    
    for line in content.split('\n'):
        line = line.strip()
        
        if line.startswith('#'):
            # Save previous section
            if current_section["title"]:
                sections.append(current_section)
            
            # Start new section
            level = len(line) - len(line.lstrip('#'))
            title = line.lstrip('#').strip()
            current_section = {"title": title, "content": "", "level": level}
        else:
            if line:
                current_section["content"] += line + "\n"
    
    # Add the last section
    if current_section["title"]:
        sections.append(current_section)
    
    return sections

def create_flowables(sections, styles):
    """Convert sections to reportlab flowables"""
    flowables = []
    
    for i, section in enumerate(sections):
        title = section["title"]
        content = section["content"].strip()
        level = section["level"]
        
        # Title Page
        if i == 0:
            flowables.append(Spacer(1, 2*inch))
            flowables.append(Paragraph(title, styles['AdrataTitle']))
            if content:
                flowables.append(Paragraph(content, styles['AdrataSubtitle']))
            flowables.append(Spacer(1, 1*inch))
            flowables.append(PageBreak())
            continue
        
        # Section headings
        if level == 2:
            flowables.append(Paragraph(title, styles['AdrataSectionHeading']))
        elif level == 3:
            flowables.append(Paragraph(title, styles['AdrataSubsectionHeading']))
        elif level == 4:
            flowables.append(Paragraph(title, styles['AdrataSubsectionHeading']))
        
        # Process content
        if content:
            paragraphs = content.split('\n\n')
            for para in paragraphs:
                para = para.strip()
                if not para:
                    continue
                
                # Handle bullet points
                if para.startswith('- '):
                    bullets = para.split('\n- ')
                    for j, bullet in enumerate(bullets):
                        bullet = bullet.lstrip('- ').strip()
                        if bullet:
                            flowables.append(Paragraph(f"• {bullet}", styles['AdrataBullet']))
                elif para.startswith('**') and para.endswith('**'):
                    # Bold emphasized text
                    clean_text = para.strip('*')
                    flowables.append(Paragraph(f"<b>{clean_text}</b>", styles['AdrataBody']))
                else:
                    # Regular paragraph
                    # Clean up markdown formatting
                    para = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', para)
                    para = re.sub(r'\*(.*?)\*', r'<i>\1</i>', para)
                    flowables.append(Paragraph(para, styles['AdrataBody']))
        
        flowables.append(Spacer(1, 12))
        
        # Add page break for major sections
        if level == 2 and i < len(sections) - 1:
            flowables.append(PageBreak())
    
    return flowables

def create_pdf_report(markdown_file, output_file):
    """Create the PDF report from markdown content"""
    # Parse content
    sections = parse_markdown_content(markdown_file)
    
    # Create styles
    styles = create_custom_styles()
    
    # Create document
    doc = AdrataDocTemplate(
        output_file,
        pagesize=A4,
        rightMargin=72,
        leftMargin=72,
        topMargin=100,
        bottomMargin=72
    )
    
    # Create flowables
    flowables = create_flowables(sections, styles)
    
    # Build PDF
    doc.build(flowables)
    
    print(f"PDF report generated: {output_file}")

def main():
    """Main function to generate the PDF"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    markdown_file = os.path.join(script_dir, "snyk-buyer-group-transformation-report.md")
    
    # Output to desktop
    desktop_path = os.path.expanduser("~/Desktop")
    output_file = os.path.join(desktop_path, "Snyk_Buyer_Group_Transformation_Report_Adrata_2025.pdf")
    
    if not os.path.exists(markdown_file):
        print(f"Error: Markdown file not found at {markdown_file}")
        return
    
    try:
        create_pdf_report(markdown_file, output_file)
        print(f"✅ Success! Report saved to: {output_file}")
    except Exception as e:
        print(f"❌ Error generating PDF: {str(e)}")

if __name__ == "__main__":
    main() 